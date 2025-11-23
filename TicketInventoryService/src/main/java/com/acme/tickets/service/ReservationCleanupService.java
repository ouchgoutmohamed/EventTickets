package com.acme.tickets.service;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Service de nettoyage automatique des réservations expirées.
 * Libère les tickets bloqués par des réservations dont le délai de hold a expiré.
 */
@Service
public class ReservationCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(ReservationCleanupService.class);

    private final ReservationRepository reservationRepository;
    private final InventoryRepository inventoryRepository;

    public ReservationCleanupService(
            ReservationRepository reservationRepository,
            InventoryRepository inventoryRepository) {
        this.reservationRepository = reservationRepository;
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * Nettoie les réservations expirées toutes les 5 minutes.
     * Marque les réservations PENDING expirées comme EXPIRED et libère le stock.
     */
    @Scheduled(cron = "${ticket-inventory.reservation.cleanup-cron:0 */5 * * * *}")
    @Transactional
    public void cleanupExpiredReservations() {
        logger.info("Début du nettoyage des réservations expirées");
        
        Instant now = Instant.now();
        List<Reservation> expiredReservations = reservationRepository
            .findExpiredReservations(ReservationStatus.PENDING, now);

        if (expiredReservations.isEmpty()) {
            logger.debug("Aucune réservation expirée trouvée");
            return;
        }

        logger.info("Traitement de {} réservations expirées", expiredReservations.size());
        
        int successCount = 0;
        int errorCount = 0;

        for (Reservation reservation : expiredReservations) {
            try {
                processExpiredReservation(reservation);
                successCount++;
            } catch (Exception e) {
                errorCount++;
                logger.error("Erreur lors du traitement de la réservation expirée {}: {}",
                    reservation.getId(), e.getMessage(), e);
            }
        }

        logger.info("Nettoyage terminé: {} réservations expirées, {} erreurs",
            successCount, errorCount);
    }

    /**
     * Traite une réservation expirée: libère le stock et marque comme EXPIRED.
     */
    private void processExpiredReservation(Reservation reservation) {
        logger.debug("Expiration de la réservation {}", reservation.getId());

        // Libération du stock
        Inventory inventory = inventoryRepository.findById(reservation.getEventId())
            .orElseThrow(() -> new IllegalStateException(
                "Inventaire introuvable pour la réservation " + reservation.getId()));

        inventory.setReserved(inventory.getReserved() - reservation.getQuantity());
        inventoryRepository.save(inventory);

        // Mise à jour du statut via méthode du domaine
        reservation.expire();
        reservationRepository.save(reservation);

        logger.info("Réservation {} expirée et {} tickets libérés",
            reservation.getId(), reservation.getQuantity());
    }
}
