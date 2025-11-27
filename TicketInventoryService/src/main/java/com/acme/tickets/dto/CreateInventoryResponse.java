package com.acme.tickets.dto;

/**
 * Réponse de création d'inventaire.
 */
public record CreateInventoryResponse(
    Long eventId,
    Integer total,
    Integer available,
    String message
) {}
