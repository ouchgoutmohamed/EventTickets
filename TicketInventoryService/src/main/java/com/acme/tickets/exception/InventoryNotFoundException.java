package com.acme.tickets.exception;

/**
 * Exception levée lorsqu'un inventaire pour un événement n'existe pas.
 */
public class InventoryNotFoundException extends RuntimeException {
    
    private final Long eventId;

    public InventoryNotFoundException(Long eventId) {
        super(String.format("Inventaire non trouvé pour l'événement: %d", eventId));
        this.eventId = eventId;
    }

    public Long getEventId() {
        return eventId;
    }
}
