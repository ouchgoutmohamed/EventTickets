package com.acme.tickets.controller;

import com.acme.tickets.dto.*;
import com.acme.tickets.service.TicketInventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour la gestion des tickets et réservations.
 * Orchestre les appels au service métier sans logique complexe (SRP).
 */
@RestController
@RequestMapping("/tickets")
@Validated
@Tag(name = "Tickets", description = "API de gestion des tickets et réservations")
public class TicketController {

    private static final Logger logger = LoggerFactory.getLogger(TicketController.class);
    
    private final TicketInventoryService ticketInventoryService;

    public TicketController(TicketInventoryService ticketInventoryService) {
        this.ticketInventoryService = ticketInventoryService;
    }

    /**
     * INT-016: Réservation de tickets pour un événement.
     * Crée une réservation temporaire avec un délai d'expiration de 15 minutes.
     * 
     * @param request Les détails de la réservation (eventId, userId, quantity)
     * @param idempotencyKey Clé d'idempotence optionnelle pour éviter les doublons
     * @return ReserveResponse contenant l'ID de la réservation et le délai d'expiration
     */
    @PostMapping("/reserve")
    @Operation(
        summary = "INT-016 Réservation de tickets",
        description = "Crée une réservation temporaire de tickets pour un événement. " +
                      "La réservation expire après 15 minutes si elle n'est pas confirmée. " +
                      "Supporte l'idempotence via le header Idempotency-Key.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Réservation créée avec succès",
                content = @Content(schema = @Schema(implementation = ReserveResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Validation échouée"),
            @ApiResponse(responseCode = "404", description = "Inventaire non trouvé"),
            @ApiResponse(responseCode = "409", description = "Stock insuffisant")
        }
    )
    public ResponseEntity<ReserveResponse> reserve(
            @Valid @RequestBody ReserveRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        
        logger.info("Requête de réservation: eventId={}, userId={}, quantity={}", 
            request.eventId(), request.userId(), request.quantity());
        
        ReserveResponse response = ticketInventoryService.reserveTickets(request, idempotencyKey);
        return ResponseEntity.ok(response);
    }

    /**
     * INT-017: Confirmation d'une réservation.
     * Transforme une réservation PENDING en CONFIRMED et génère les tickets.
     * 
     * @param request L'identifiant de la réservation à confirmer
     * @return ConfirmResponse avec le statut CONFIRMED
     */
    @PostMapping("/confirm")
    @Operation(
        summary = "INT-017 Confirmation d'une réservation",
        description = "Confirme une réservation en attente. " +
                      "Transforme les tickets réservés en tickets confirmés et déclenche le processus de paiement.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Réservation confirmée avec succès",
                content = @Content(schema = @Schema(implementation = ConfirmResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Validation échouée"),
            @ApiResponse(responseCode = "404", description = "Réservation non trouvée"),
            @ApiResponse(responseCode = "422", description = "État invalide ou expirée")
        }
    )
    public ResponseEntity<ConfirmResponse> confirm(@Valid @RequestBody ConfirmRequest request) {
        logger.info("Confirmation de la réservation: {}", request.reservationId());
        
        ConfirmResponse response = ticketInventoryService.confirmReservation(request);
        return ResponseEntity.ok(response);
    }

    /**
     * INT-018: Libération (annulation) d'une réservation.
     * Annule une réservation et libère les tickets réservés.
     * 
     * @param request L'identifiant de la réservation à annuler
     * @return ReleaseResponse avec le statut CANCELED
     */
    @PostMapping("/release")
    @Operation(
        summary = "INT-018 Libération d'une réservation",
        description = "Annule une réservation en attente ou confirmée. " +
                      "Libère les tickets réservés et les rend disponibles pour d'autres utilisateurs.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Réservation annulée avec succès",
                content = @Content(schema = @Schema(implementation = ReleaseResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Validation échouée"),
            @ApiResponse(responseCode = "404", description = "Réservation non trouvée")
        }
    )
    public ResponseEntity<ReleaseResponse> release(@Valid @RequestBody ReleaseRequest request) {
        logger.info("Libération de la réservation: {}", request.reservationId());
        
        ReleaseResponse response = ticketInventoryService.releaseReservation(request);
        return ResponseEntity.ok(response);
    }

    /**
     * INT-019: Consulter la disponibilité des tickets pour un événement.
     * Retourne le stock total et le nombre de tickets disponibles.
     * 
     * @param eventId L'identifiant de l'événement
     * @return AvailabilityResponse avec total et available
     */
    @GetMapping("/availability/{eventId}")
    @Operation(
        summary = "INT-019 Disponibilité d'un événement",
        description = "Retourne les informations de disponibilité des tickets pour un événement donné. " +
                      "Calcule le nombre de tickets disponibles (total - reserved).",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Informations de disponibilité retournées avec succès",
                content = @Content(schema = @Schema(implementation = AvailabilityResponse.class))
            ),
            @ApiResponse(responseCode = "404", description = "Inventaire non trouvé")
        }
    )
    public ResponseEntity<AvailabilityResponse> getAvailability(@PathVariable Long eventId) {
        logger.debug("Consultation de disponibilité pour l'événement: {}", eventId);
        
        AvailabilityResponse response = ticketInventoryService.getAvailability(eventId);
        return ResponseEntity.ok(response);
    }

    // Endpoint de création/mise à jour d'inventaire supprimé (découplage).

    /**
     * INT-020: Consulter les réservations et achats d'un utilisateur.
     * Retourne toutes les réservations (PENDING, CONFIRMED, CANCELED, EXPIRED) pour un utilisateur.
     * 
     * @param userId L'identifiant de l'utilisateur
     * @return UserReservationsResponse contenant la liste des réservations
     */
    @GetMapping("/user/{userId}")
    @Operation(
        summary = "INT-020 Réservations/achats d'un utilisateur",
        description = "Retourne la liste complète des réservations d'un utilisateur, " +
                      "incluant les réservations en attente, confirmées, annulées et expirées, " +
                      "triées par date de création décroissante.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Liste des réservations retournée avec succès",
                content = @Content(schema = @Schema(implementation = UserReservationsResponse.class))
            )
        }
    )
    public ResponseEntity<UserReservationsResponse> getUserReservations(@PathVariable Long userId) {
        logger.debug("Récupération des réservations pour l'utilisateur: {}", userId);
        
        UserReservationsResponse response = ticketInventoryService.getUserReservations(userId);
        return ResponseEntity.ok(response);
    }
}
