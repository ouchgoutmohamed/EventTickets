package com.acme.tickets.exception;

import com.acme.tickets.domain.enums.ReservationStatus;

/**
 * Exception levée lorsqu'une opération est tentée sur une réservation dans un état invalide.
 */
public class InvalidReservationStateException extends RuntimeException {
    
    private final Long reservationId;
    private final ReservationStatus currentStatus;
    private final ReservationStatus expectedStatus;

    public InvalidReservationStateException(Long reservationId, ReservationStatus currentStatus, 
                                           ReservationStatus expectedStatus) {
        super(String.format("Réservation %d dans un état invalide: %s (attendu: %s)",
            reservationId, currentStatus, expectedStatus));
        this.reservationId = reservationId;
        this.currentStatus = currentStatus;
        this.expectedStatus = expectedStatus;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public ReservationStatus getCurrentStatus() {
        return currentStatus;
    }

    public ReservationStatus getExpectedStatus() {
        return expectedStatus;
    }
}
