package com.acme.tickets.exception;

/**
 * Exception levée lorsque le stock de tickets est insuffisant pour une réservation.
 */
public class InsufficientStockException extends RuntimeException {
    
    private final Long eventId;
    private final int requested;
    private final int available;

    public InsufficientStockException(Long eventId, int requested, int available) {
        super(String.format("Stock insuffisant pour l'événement %d: %d demandés, %d disponibles",
            eventId, requested, available));
        this.eventId = eventId;
        this.requested = requested;
        this.available = available;
    }

    public Long getEventId() {
        return eventId;
    }

    public int getRequested() {
        return requested;
    }

    public int getAvailable() {
        return available;
    }
}
