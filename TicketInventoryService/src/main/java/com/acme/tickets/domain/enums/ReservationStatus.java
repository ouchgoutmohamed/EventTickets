package com.acme.tickets.domain.enums;

/**
 * Statut d'une réservation de tickets.
 */
public enum ReservationStatus {
    /**
     * Réservation en attente de confirmation.
     */
    PENDING,
    
    /**
     * Réservation confirmée et validée.
     */
    CONFIRMED,
    
    /**
     * Réservation annulée par l'utilisateur ou le système.
     */
    CANCELED,
    
    /**
     * Réservation expirée (délai de hold dépassé).
     */
    EXPIRED
}
