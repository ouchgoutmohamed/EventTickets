package com.acme.tickets.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Réponse contenant la liste des réservations d'un utilisateur.
 */
@Schema(description = "Liste des réservations et achats d'un utilisateur")
public record UserReservationsResponse(
    
    @Schema(description = "Liste des réservations de l'utilisateur")
    List<UserReservationsItem> items
) {
}
