package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Représente une réservation dans la liste des réservations d'un utilisateur.
 */
@Schema(description = "Détail d'une réservation utilisateur")
public record UserReservationsItem(
    
    @Schema(description = "Identifiant de la réservation", example = "123")
    Long reservationId,
    
    @Schema(description = "Identifiant de l'événement", example = "1")
    Long eventId,
    
    @Schema(description = "Nombre de tickets réservés", example = "2")
    int quantity,
    
    @Schema(description = "Statut de la réservation", example = "CONFIRMED")
    String status,
    
    @Schema(description = "Date de création de la réservation", example = "2025-11-07T14:00:00Z")
    Instant createdAt,
    
    @Schema(description = "Date de dernière mise à jour de la réservation", example = "2025-11-07T14:15:00Z")
    Instant updatedAt
) {
}
