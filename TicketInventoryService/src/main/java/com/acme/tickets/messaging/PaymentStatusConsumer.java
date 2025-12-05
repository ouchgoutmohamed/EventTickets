package com.acme.tickets.messaging;

import com.acme.tickets.dto.ConfirmRequest;
import com.acme.tickets.dto.PaymentStatusMessage;
import com.acme.tickets.dto.ReleaseRequest;
import com.acme.tickets.exception.ReservationNotFoundException;
import com.acme.tickets.service.TicketInventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumer RabbitMQ pour les événements de paiement.
 * 
 * Écoute la queue 'payment' et traite les messages de statut de paiement
 * envoyés par le PaymentService (PHP/Laravel).
 * 
 * Actions effectuées selon le statut :
 * - SUCCESS : Confirme la réservation et génère les tickets
 * - FAILED : Libère la réservation et remet les tickets en stock
 * - REFUNDED : Annule la réservation (si applicable)
 */
@Component
public class PaymentStatusConsumer {

    private static final Logger logger = LoggerFactory.getLogger(PaymentStatusConsumer.class);

    private final TicketInventoryService ticketInventoryService;

    public PaymentStatusConsumer(TicketInventoryService ticketInventoryService) {
        this.ticketInventoryService = ticketInventoryService;
    }

    /**
     * Écoute la queue 'payment' pour les messages de statut de paiement.
     * Cette queue correspond à celle utilisée par PaymentService.php
     * 
     * @param message Le message de statut de paiement (peut être un simple String ou un objet JSON)
     */
    @RabbitListener(queues = "payment")
    public void handlePaymentStatusFromPaymentQueue(String message) {
        logger.info("📩 Message reçu sur queue 'payment': {}", message);
        
        // Le PaymentService PHP envoie actuellement juste le status comme String
        // Format: "SUCCESS" ou "FAILED"
        try {
            if ("SUCCESS".equalsIgnoreCase(message.trim())) {
                logger.info("✅ Paiement réussi reçu - En attente de l'ID de réservation pour confirmation");
                // Note: Le PaymentService actuel n'envoie pas l'ID de réservation
                // TODO: Améliorer le PaymentService pour envoyer un message JSON complet
            } else if ("FAILED".equalsIgnoreCase(message.trim())) {
                logger.warn("❌ Paiement échoué reçu - En attente de l'ID de réservation pour annulation");
            } else {
                logger.warn("⚠️ Statut de paiement inconnu: {}", message);
            }
        } catch (Exception e) {
            logger.error("❌ Erreur lors du traitement du message de paiement: {}", e.getMessage(), e);
        }
    }

    /**
     * Écoute la queue 'payment-status' pour les messages JSON structurés.
     * Cette queue est prévue pour une version améliorée du PaymentService.
     * 
     * @param message Le message de statut de paiement au format JSON
     */
    @RabbitListener(queues = "#{@paymentStatusQueue.name}", containerFactory = "rabbitListenerContainerFactory")
    public void handlePaymentStatus(PaymentStatusMessage message) {
        logger.info("📩 Message de paiement structuré reçu: reservationId={}, status={}", 
            message.reservationId(), message.status());

        try {
            if (message.isSuccess()) {
                handlePaymentSuccess(message);
            } else if (message.isFailed()) {
                handlePaymentFailure(message);
            } else if (message.isRefunded()) {
                handlePaymentRefund(message);
            } else {
                logger.warn("⚠️ Statut de paiement non reconnu: {}", message.status());
            }
        } catch (ReservationNotFoundException e) {
            logger.error("❌ Réservation non trouvée: {}", message.reservationId());
        } catch (Exception e) {
            logger.error("❌ Erreur lors du traitement du paiement: {}", e.getMessage(), e);
            // TODO: Implémenter une stratégie de retry ou DLQ (Dead Letter Queue)
        }
    }

    /**
     * Traite un paiement réussi : confirme la réservation.
     */
    private void handlePaymentSuccess(PaymentStatusMessage message) {
        logger.info("✅ Traitement du paiement réussi pour la réservation {}", message.reservationId());
        
        try {
            var response = ticketInventoryService.confirmReservation(
                new ConfirmRequest(message.reservationId())
            );
            logger.info("✅ Réservation {} confirmée avec succès. Statut: {}", 
                message.reservationId(), response.status());
        } catch (Exception e) {
            logger.error("❌ Échec de la confirmation de la réservation {}: {}", 
                message.reservationId(), e.getMessage());
            throw e;
        }
    }

    /**
     * Traite un paiement échoué : libère la réservation.
     */
    private void handlePaymentFailure(PaymentStatusMessage message) {
        logger.warn("❌ Traitement du paiement échoué pour la réservation {}", message.reservationId());
        
        try {
            var response = ticketInventoryService.releaseReservation(
                new ReleaseRequest(message.reservationId())
            );
            logger.info("🔓 Réservation {} libérée suite à l'échec du paiement. Statut: {}", 
                message.reservationId(), response.status());
        } catch (Exception e) {
            logger.error("❌ Échec de la libération de la réservation {}: {}", 
                message.reservationId(), e.getMessage());
            throw e;
        }
    }

    /**
     * Traite un remboursement : annule la réservation.
     */
    private void handlePaymentRefund(PaymentStatusMessage message) {
        logger.info("💰 Traitement du remboursement pour la réservation {}", message.reservationId());
        
        try {
            var response = ticketInventoryService.releaseReservation(
                new ReleaseRequest(message.reservationId())
            );
            logger.info("💰 Réservation {} annulée suite au remboursement. Statut: {}", 
                message.reservationId(), response.status());
        } catch (Exception e) {
            logger.error("❌ Échec de l'annulation de la réservation {} pour remboursement: {}", 
                message.reservationId(), e.getMessage());
            throw e;
        }
    }
}
