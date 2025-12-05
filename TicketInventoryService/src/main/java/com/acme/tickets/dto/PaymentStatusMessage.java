package com.acme.tickets.dto;

/**
 * DTO pour les messages de statut de paiement reçus via RabbitMQ.
 * Correspond aux messages envoyés par le PaymentService (PHP/Laravel).
 */
public record PaymentStatusMessage(
    Long reservationId,
    Long userId,
    Long eventId,
    String status,
    String transactionId,
    String reason
) {
    /**
     * Vérifie si le paiement est réussi.
     */
    public boolean isSuccess() {
        return "SUCCESS".equalsIgnoreCase(status);
    }

    /**
     * Vérifie si le paiement a échoué.
     */
    public boolean isFailed() {
        return "FAILED".equalsIgnoreCase(status);
    }

    /**
     * Vérifie si le paiement a été remboursé.
     */
    public boolean isRefunded() {
        return "REFUNDED".equalsIgnoreCase(status);
    }
}
