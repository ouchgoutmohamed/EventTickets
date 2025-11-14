package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Réponse suite à la confirmation d'une réservation.
 */
@Schema(description = "Réponse de confirmation de réservation")
public record ConfirmResponse(
    
    @Schema(description = "Statut de la réservation après confirmation", example = "CONFIRMED")
    String status
) {
}
