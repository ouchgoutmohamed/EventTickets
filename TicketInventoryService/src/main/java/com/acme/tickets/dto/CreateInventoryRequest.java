package com.acme.tickets.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Requête de création d'inventaire pour un événement.
 */
public record CreateInventoryRequest(
    
    @NotNull(message = "L'identifiant de l'événement est obligatoire")
    Long eventId,
    
    @NotNull(message = "Le nombre total de tickets est obligatoire")
    @Min(value = 1, message = "Le nombre total de tickets doit être au moins 1")
    Integer total
) {}
