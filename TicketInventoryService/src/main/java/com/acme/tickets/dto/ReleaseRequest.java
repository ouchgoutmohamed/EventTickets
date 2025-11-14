package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Requête pour libérer (annuler) une réservation de tickets.
 */
@Schema(description = "Requête de libération/annulation de réservation")
public record ReleaseRequest(
    
    @NotNull(message = "L'identifiant de la réservation est obligatoire")
    @Positive(message = "L'identifiant de la réservation doit être positif")
    @Schema(description = "Identifiant de la réservation à annuler", example = "123")
    Long reservationId
) {
}
