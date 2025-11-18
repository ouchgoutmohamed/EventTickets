package com.acme.tickets.service;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.entity.Ticket;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
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
    private static final int RESERVATION_HOLD_MINUTES = 15;

    private final InventoryRepository inventoryRepository;
    private final ReservationRepository reservationRepository;
    private final TicketRepository ticketRepository;

    public TicketInventoryService(
            InventoryRepository inventoryRepository,
            ReservationRepository reservationRepository,
            TicketRepository ticketRepository) {
        this.inventoryRepository = inventoryRepository;
        this.reservationRepository = reservationRepository;
        this.ticketRepository = ticketRepository;
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
        logger.info("Réservation de {} tickets pour l'événement {} par l'utilisateur {}",
            request.quantity(), request.eventId(), request.userId());

        // Vérification idempotence
        if (idempotencyKey != null) {
            var existing = reservationRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                Reservation reservation = existing.get();
                logger.info("Réservation idempotente trouvée: {}", reservation.getId());
                return new ReserveResponse(
                    reservation.getId(),
                    reservation.getStatus().name(),
                    reservation.getHoldExpiresAt()
                );
            }
        }

        // Récupération de l'inventaire avec verrou
        Inventory inventory = inventoryRepository.findByIdWithLock(request.eventId())
            .orElseThrow(() -> new InventoryNotFoundException(request.eventId()));

        // Vérification du stock disponible
        int available = inventory.getAvailable();
        if (available < request.quantity()) {
            throw new InsufficientStockException(request.eventId(), request.quantity(), available);
        }

        // Création de la réservation
        Instant expiresAt = Instant.now().plus(RESERVATION_HOLD_MINUTES, ChronoUnit.MINUTES);
        Reservation reservation = new Reservation(
            request.eventId(),
            request.userId(),
            request.quantity(),
            ReservationStatus.PENDING
        );
        reservation.setHoldExpiresAt(expiresAt);
        reservation.setIdempotencyKey(idempotencyKey);

        // Mise à jour de l'inventaire
        inventory.setReserved(inventory.getReserved() + request.quantity());
        inventoryRepository.save(inventory);

        // Sauvegarde de la réservation
        Reservation saved = reservationRepository.save(reservation);
        
        logger.info("Réservation créée avec succès: {}, expire à {}", saved.getId(), expiresAt);

        return new ReserveResponse(saved.getId(), saved.getStatus().name(), expiresAt);
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
        logger.info("Confirmation de la réservation {}", request.reservationId());

        Reservation reservation = reservationRepository.findById(request.reservationId())
            .orElseThrow(() -> new ReservationNotFoundException(request.reservationId()));

        // Vérifications d'état
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new InvalidReservationStateException(
                reservation.getId(),
                reservation.getStatus(),
                ReservationStatus.PENDING
            );
        }

        if (reservation.getHoldExpiresAt() != null 
            && Instant.now().isAfter(reservation.getHoldExpiresAt())) {
            throw new ReservationExpiredException(reservation.getId());
        }

        // Mise à jour du statut
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);

        // Création des tickets
        Ticket ticket = new Ticket(
            reservation.getId(),
            reservation.getUserId(),
            reservation.getEventId(),
            reservation.getQuantity()
        );
        ticketRepository.save(ticket);

        logger.info("Réservation {} confirmée, ticket {} créé", 
            reservation.getId(), ticket.getId());

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
        logger.info("Libération de la réservation {}", request.reservationId());

        Reservation reservation = reservationRepository.findById(request.reservationId())
            .orElseThrow(() -> new ReservationNotFoundException(request.reservationId()));

        // Vérification que la réservation n'est pas déjà annulée
        if (reservation.getStatus() == ReservationStatus.CANCELED 
            || reservation.getStatus() == ReservationStatus.EXPIRED) {
            logger.warn("Réservation {} déjà annulée/expirée: {}", 
                reservation.getId(), reservation.getStatus());
            return new ReleaseResponse(reservation.getStatus().name());
        }

        // Libération du stock si PENDING
        if (reservation.getStatus() == ReservationStatus.PENDING) {
            Inventory inventory = inventoryRepository.findById(reservation.getEventId())
                .orElseThrow(() -> new InventoryNotFoundException(reservation.getEventId()));
            
            inventory.setReserved(inventory.getReserved() - reservation.getQuantity());
            inventoryRepository.save(inventory);
        }

        // Mise à jour du statut
        reservation.setStatus(ReservationStatus.CANCELED);
        reservationRepository.save(reservation);

        logger.info("Réservation {} annulée", reservation.getId());

        // TODO: Si CONFIRMED, déclencher un remboursement

        return new ReleaseResponse(ReservationStatus.CANCELED.name());
    }

    /**
     * Consulte la disponibilité des tickets pour un événement.
     *
     * @param eventId Identifiant de l'événement
     * @return Informations de disponibilité
     * @throws InventoryNotFoundException Si l'inventaire n'existe pas
     */
    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(Long eventId) {
        logger.debug("Consultation de la disponibilité pour l'événement {}", eventId);

        Inventory inventory = inventoryRepository.findById(eventId)
            .orElseThrow(() -> new InventoryNotFoundException(eventId));

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
            .map(r -> new UserReservationsItem(
                r.getId(),
                r.getEventId(),
                r.getQuantity(),
                r.getStatus().name(),
                r.getCreatedAt(),
                r.getUpdatedAt()
            ))
            .toList();

        return new UserReservationsResponse(items);
    }
}
