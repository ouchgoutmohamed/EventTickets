package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Requête pour confirmer une réservation de tickets.
 */
@Schema(description = "Requête de confirmation de réservation")
public record ConfirmRequest(
    
    @NotNull(message = "L'identifiant de la réservation est obligatoire")
    @Positive(message = "L'identifiant de la réservation doit être positif")
    @Schema(description = "Identifiant de la réservation à confirmer", example = "123")
    Long reservationId
) {
}
