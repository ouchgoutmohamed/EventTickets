package com.acme.tickets.service;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.entity.Ticket;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.config.TicketInventoryProperties;
import com.acme.tickets.dto.*;
import com.acme.tickets.exception.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service de gestion des réservations et inventaires de tickets.
 * Centralise la logique métier en respectant le principe SRP.
 */
@Service
public class TicketInventoryService {

    private static final Logger logger = LoggerFactory.getLogger(TicketInventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final ReservationRepository reservationRepository;
    private final TicketRepository ticketRepository;
    private final TicketInventoryProperties properties;

    public TicketInventoryService(
            InventoryRepository inventoryRepository,
            ReservationRepository reservationRepository,
            TicketRepository ticketRepository,
            TicketInventoryProperties properties) {
        this.inventoryRepository = inventoryRepository;
        this.reservationRepository = reservationRepository;
        this.ticketRepository = ticketRepository;
        this.properties = properties;
    }

    /**
     * Réserve des tickets pour un événement.
     * Crée une réservation temporaire avec expiration.
     *
     * @param request Détails de la réservation
     * @param idempotencyKey Clé d'idempotence pour éviter les doublons
     * @return Réponse avec l'ID de réservation et l'expiration
     * @throws InventoryNotFoundException Si l'inventaire n'existe pas
     * @throws InsufficientStockException Si le stock est insuffisant
     */
    @Transactional
    public ReserveResponse reserveTickets(ReserveRequest request, String idempotencyKey) {
        logger.debug("Réservation de {} tickets pour l'événement {} par l'utilisateur {}",
            request.quantity(), request.eventId(), request.userId());

        // Vérification idempotence
        if (idempotencyKey != null) {
            Reservation existing = reservationRepository.findByIdempotencyKey(idempotencyKey)
                .orElse(null);
            if (existing != null && existing.isActive()) {
                logger.info("Réservation idempotente trouvée: {}", existing.getId());
                return buildReserveResponse(existing);
            }
        }

        // Récupération de l'inventaire avec verrou
        Inventory inventory = getInventoryWithLock(request.eventId());

        // Vérification du stock disponible
        validateSufficientStock(inventory, request.quantity());

        // Création de la réservation
        Instant expiresAt = calculateExpirationTime();
        Reservation reservation = new Reservation(
            request.eventId(),
            request.userId(),
            request.quantity(),
            ReservationStatus.PENDING
        );
        reservation.setHoldExpiresAt(expiresAt);
        reservation.setIdempotencyKey(idempotencyKey);

        // Mise à jour de l'inventaire avec vérification défensive
        decrementStock(inventory, request.quantity());
        inventoryRepository.save(inventory);

        // Sauvegarde de la réservation
        Reservation saved = reservationRepository.save(reservation);
        
        logger.info("Réservation créée avec succès: {}, expire à {}", saved.getId(), expiresAt);

        return buildReserveResponse(saved);
    }

    /**
     * Confirme une réservation et génère les tickets.
     *
     * @param request Identifiant de la réservation
     * @return Réponse avec le statut confirmé
     * @throws ReservationNotFoundException Si la réservation n'existe pas
     * @throws InvalidReservationStateException Si la réservation n'est pas PENDING
     * @throws ReservationExpiredException Si la réservation a expiré
     */
    @Transactional
    public ConfirmResponse confirmReservation(ConfirmRequest request) {
        logger.debug("Confirmation de la réservation {}", request.reservationId());

        Reservation reservation = getReservationOrThrow(request.reservationId());

        // Utilisation de la logique métier du domaine
        if (!reservation.canBeConfirmed()) {
            if (reservation.isExpired()) {
                throw new ReservationExpiredException(reservation.getId());
            }
            throw new InvalidReservationStateException(
                reservation.getId(),
                reservation.getStatus(),
                ReservationStatus.PENDING
            );
        }

        // Confirmation via méthode du domaine
        reservation.confirm();
        reservationRepository.save(reservation);

        // Création des tickets
        createTicketsForReservation(reservation);

        logger.info("Réservation {} confirmée", reservation.getId());

        // TODO: Publier événement ReservationConfirmed pour déclencher le paiement

        return new ConfirmResponse(ReservationStatus.CONFIRMED.name());
    }

    /**
     * Annule une réservation et libère les tickets.
     *
     * @param request Identifiant de la réservation
     * @return Réponse avec le statut annulé
     * @throws ReservationNotFoundException Si la réservation n'existe pas
     */
    @Transactional
    public ReleaseResponse releaseReservation(ReleaseRequest request) {
        logger.debug("Libération de la réservation {}", request.reservationId());

        Reservation reservation = getReservationOrThrow(request.reservationId());

        // Utilisation de la logique métier du domaine
        if (!reservation.isActive()) {
            logger.warn("Réservation {} déjà annulée/expirée: {}", 
                reservation.getId(), reservation.getStatus());
            return new ReleaseResponse(reservation.getStatus().name());
        }

        // Libération du stock si PENDING
        if (reservation.getStatus() == ReservationStatus.PENDING) {
            releaseInventoryStock(reservation);
        }

        // Annulation via méthode du domaine
        reservation.cancel();
        reservationRepository.save(reservation);

        logger.info("Réservation {} annulée", reservation.getId());

        // TODO: Si CONFIRMED, déclencher un remboursement

        return new ReleaseResponse(ReservationStatus.CANCELED.name());
    }

    /**
     * Crée ou met à jour l'inventaire pour un événement.
     *
     * @param request Détails de l'inventaire à créer
     * @return CreateInventoryResponse avec les détails de l'inventaire créé
     */
    @Transactional
    public CreateInventoryResponse createOrUpdateInventory(CreateInventoryRequest request) {
        logger.info("Création/Mise à jour de l'inventaire pour l'événement {}", request.eventId());

        Inventory inventory = inventoryRepository.findById(request.eventId())
            .map(existing -> {
                existing.setTotal(request.total());
                logger.info("Mise à jour de l'inventaire existant pour l'événement {}", request.eventId());
                return existing;
            })
            .orElseGet(() -> {
                logger.info("Création d'un nouvel inventaire pour l'événement {}", request.eventId());
                return new Inventory(request.eventId(), request.total());
            });

        inventory = inventoryRepository.save(inventory);

        return new CreateInventoryResponse(
            inventory.getEventId(),
            inventory.getTotal(),
            inventory.getAvailable(),
            "Inventaire créé/mis à jour avec succès"
        );
    }

    /**
     * Consulte la disponibilité des tickets pour un événement.
     *
     * @param eventId Identifiant de l'événement
     * @return AvailabilityResponse avec total et available
     * @throws InventoryNotFoundException Si l'inventaire n'existe pas
     */
    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(Long eventId) {
        logger.debug("Consultation de la disponibilité pour l'événement {}", eventId);

        Inventory inventory = getInventoryOrThrow(eventId);

        return new AvailabilityResponse(
            eventId,
            inventory.getTotal(),
            inventory.getAvailable()
        );
    }

    /**
     * Récupère toutes les réservations d'un utilisateur.
     *
     * @param userId Identifiant de l'utilisateur
     * @return Liste des réservations
     */
    @Transactional(readOnly = true)
    public UserReservationsResponse getUserReservations(Long userId) {
        logger.debug("Récupération des réservations de l'utilisateur {}", userId);

        List<Reservation> reservations = reservationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<UserReservationsItem> items = reservations.stream()
            .map(this::toUserReservationItem)
            .toList();

        return new UserReservationsResponse(items);
    }

    // ========== MÉTHODES PRIVÉES (Helper Methods) ==========

    /**
     * Récupère une réservation ou lève une exception.
     */
    private Reservation getReservationOrThrow(Long id) {
        return reservationRepository.findById(id)
            .orElseThrow(() -> new ReservationNotFoundException(id));
    }

    /**
     * Récupère un inventaire ou lève une exception.
     */
    private Inventory getInventoryOrThrow(Long eventId) {
        return inventoryRepository.findById(eventId)
            .orElseThrow(() -> new InventoryNotFoundException(eventId));
    }

    /**
     * Récupère un inventaire avec verrou pessimiste.
     */
    private Inventory getInventoryWithLock(Long eventId) {
        return inventoryRepository.findByIdWithLock(eventId)
            .orElseThrow(() -> new InventoryNotFoundException(eventId));
    }

    /**
     * Valide que le stock est suffisant.
     */
    private void validateSufficientStock(Inventory inventory, int requested) {
        int available = inventory.getAvailable();
        if (available < requested) {
            throw new InsufficientStockException(
                inventory.getEventId(), requested, available
            );
        }
    }

    /**
     * Décrémente le stock avec vérification défensive.
     */
    private void decrementStock(Inventory inventory, int quantity) {
        int newReserved = inventory.getReserved() + quantity;
        if (newReserved > inventory.getTotal()) {
            throw new IllegalStateException(
                String.format("Reserved count (%d) would exceed total (%d)",
                    newReserved, inventory.getTotal())
            );
        }
        inventory.setReserved(newReserved);
    }

    /**
     * Incrémente le stock (libération) avec vérification défensive.
     */
    private void incrementStock(Inventory inventory, int quantity) {
        int newReserved = inventory.getReserved() - quantity;
        if (newReserved < 0) {
            logger.error("Tentative de stock négatif: {} - {} = {}", 
                inventory.getReserved(), quantity, newReserved);
            inventory.setReserved(0); // Défensif: empêche les valeurs négatives
        } else {
            inventory.setReserved(newReserved);
        }
    }

    /**
     * Libère le stock d'inventaire pour une réservation.
     */
    private void releaseInventoryStock(Reservation reservation) {
        Inventory inventory = getInventoryOrThrow(reservation.getEventId());
        incrementStock(inventory, reservation.getQuantity());
        inventoryRepository.save(inventory);
    }

    /**
     * Crée les tickets pour une réservation confirmée.
     */
    private void createTicketsForReservation(Reservation reservation) {
        Ticket ticket = new Ticket(
            reservation.getId(),
            reservation.getUserId(),
            reservation.getEventId(),
            reservation.getQuantity()
        );
        ticketRepository.save(ticket);
        logger.debug("Ticket {} créé pour la réservation {}", ticket.getId(), reservation.getId());
    }

    /**
     * Calcule le temps d'expiration d'une réservation.
     */
    private Instant calculateExpirationTime() {
        return Instant.now().plus(
            properties.getReservationHoldMinutes(), 
            ChronoUnit.MINUTES
        );
    }

    /**
     * Construit une réponse de réservation.
     */
    private ReserveResponse buildReserveResponse(Reservation reservation) {
        return new ReserveResponse(
            reservation.getId(),
            reservation.getStatus().name(),
            reservation.getHoldExpiresAt()
        );
    }

    /**
     * Convertit une réservation en item de réponse utilisateur.
     */
    private UserReservationsItem toUserReservationItem(Reservation r) {
        return new UserReservationsItem(
            r.getId(),
            r.getEventId(),
            r.getQuantity(),
            r.getStatus().name(),
            r.getCreatedAt(),
            r.getUpdatedAt()
        );
    }
}
