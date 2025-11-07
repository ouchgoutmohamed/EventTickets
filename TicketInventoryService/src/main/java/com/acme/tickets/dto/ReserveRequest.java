package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Requête pour réserver des tickets pour un événement.
 */
@Schema(description = "Requête de réservation de tickets")
public record ReserveRequest(
    
    @NotNull(message = "L'identifiant de l'événement est obligatoire")
    @Positive(message = "L'identifiant de l'événement doit être positif")
    @Schema(description = "Identifiant de l'événement", example = "1")
    Long eventId,
    
    @NotNull(message = "L'identifiant de l'utilisateur est obligatoire")
    @Positive(message = "L'identifiant de l'utilisateur doit être positif")
    @Schema(description = "Identifiant de l'utilisateur", example = "42")
    Long userId,
    
    @NotNull(message = "La quantité est obligatoire")
    @Positive(message = "La quantité doit être positive")
    @Max(value = 10, message = "La quantité maximale est de 10 tickets")
    @Schema(description = "Nombre de tickets à réserver", example = "2", minimum = "1", maximum = "10")
    Integer quantity
) {
}
