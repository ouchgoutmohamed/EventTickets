package com.acme.tickets.exception;

/**
 * Exception levée lorsqu'une réservation a expiré.
 */
public class ReservationExpiredException extends RuntimeException {
    
    private final Long reservationId;

    public ReservationExpiredException(Long reservationId) {
        super(String.format("La réservation %d a expiré", reservationId));
        this.reservationId = reservationId;
    }

    public Long getReservationId() {
        return reservationId;
    }
}
