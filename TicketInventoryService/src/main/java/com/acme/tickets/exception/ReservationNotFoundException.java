package com.acme.tickets.exception;

/**
 * Exception levée lorsqu'une réservation demandée n'existe pas.
 */
public class ReservationNotFoundException extends RuntimeException {
    
    private final Long reservationId;

    public ReservationNotFoundException(Long reservationId) {
        super(String.format("Réservation non trouvée avec l'ID: %d", reservationId));
        this.reservationId = reservationId;
    }

    public Long getReservationId() {
        return reservationId;
    }
}
