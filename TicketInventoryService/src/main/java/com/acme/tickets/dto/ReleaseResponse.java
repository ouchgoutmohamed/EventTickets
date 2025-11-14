package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Réponse suite à la libération d'une réservation.
 */
@Schema(description = "Réponse de libération/annulation de réservation")
public record ReleaseResponse(
    
    @Schema(description = "Statut de la réservation après libération", example = "CANCELED")
    String status
) {
}
