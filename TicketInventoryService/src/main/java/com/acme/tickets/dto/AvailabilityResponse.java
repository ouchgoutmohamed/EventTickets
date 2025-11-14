package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Réponse contenant les informations de disponibilité des tickets pour un événement.
 */
@Schema(description = "Disponibilité des tickets pour un événement")
public record AvailabilityResponse(
    
    @Schema(description = "Identifiant de l'événement", example = "1")
    Long eventId,
    
    @Schema(description = "Nombre total de tickets pour cet événement", example = "100")
    int total,
    
    @Schema(description = "Nombre de tickets disponibles (non réservés)", example = "98")
    int available
) {
}
