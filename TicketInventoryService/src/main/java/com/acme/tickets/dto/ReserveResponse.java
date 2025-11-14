package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Réponse suite à une demande de réservation de tickets.
 */
@Schema(description = "Réponse de réservation de tickets")
public record ReserveResponse(
    
    @Schema(description = "Identifiant de la réservation créée", example = "123")
    Long reservationId,
    
    @Schema(description = "Statut de la réservation", example = "PENDING")
    String status,
    
    @Schema(description = "Date d'expiration de la réservation temporaire", example = "2025-11-07T15:30:00Z")
    Instant holdExpiresAt
) {
}
