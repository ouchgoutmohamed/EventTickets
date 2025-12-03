package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.api.reponses.EventResponse;
import com.project.eventcatalogservice.api.requests.CreateEventRequest;
import com.project.eventcatalogservice.api.requests.UpdateEventRequest;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.security.CustomUserDetails;
import com.project.eventcatalogservice.services.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "API de gestion des événements - Création, consultation, modification et suppression d'événements")
public class EventController {

    private final EventService eventService;

    @PostMapping("/create")
    @Operation(
        summary = "Créer un nouvel événement",
        description = "Permet à un organisateur ou admin de créer un nouvel événement. Requiert une authentification JWT.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Événement créé avec succès",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès refusé - rôle ORGANIZER ou ADMIN requis")
    })
    public ResponseEntity<EventResponse> createEvent(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Détails de l'événement à créer",
                required = true,
                content = @Content(schema = @Schema(implementation = CreateEventRequest.class))
            )
            @RequestBody CreateEventRequest request,
            @Parameter(hidden = true)
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        EventResponse response = eventService.createEvent(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Mettre à jour un événement",
        description = "Permet au propriétaire ou à un admin de modifier un événement existant. Requiert une authentification JWT.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Événement mis à jour avec succès",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès refusé - vous devez être le propriétaire ou admin"),
        @ApiResponse(responseCode = "404", description = "Événement non trouvé")
    })
    public ResponseEntity<EventResponse> updateEvent(
            @Parameter(description = "ID de l'événement à modifier", required = true, example = "1")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Nouvelles données de l'événement",
                required = true,
                content = @Content(schema = @Schema(implementation = UpdateEventRequest.class))
            )
            @RequestBody UpdateEventRequest request,
            @Parameter(hidden = true)
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        EventResponse response = eventService.updateEvent(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Supprimer un événement (soft delete)",
        description = "Marque un événement comme supprimé (soft delete). Accessible uniquement au propriétaire ou admin. Requiert une authentification JWT.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Événement supprimé avec succès"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès refusé - vous devez être le propriétaire ou admin"),
        @ApiResponse(responseCode = "404", description = "Événement non trouvé")
    })
    public ResponseEntity<Void> deleteEvent(
            @Parameter(description = "ID de l'événement à supprimer", required = true, example = "1")
            @PathVariable Long id,
            @Parameter(hidden = true)
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        eventService.deleteEvent(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Récupérer un événement par ID",
        description = "Retourne les détails complets d'un événement spécifique. Endpoint public."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Événement trouvé",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "404", description = "Événement non trouvé")
    })
    public ResponseEntity<EventResponse> getEvent(
            @Parameter(description = "ID de l'événement", required = true, example = "1")
            @PathVariable Long id) {
        EventResponse response = eventService.getEventById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list-events")
    @Operation(
        summary = "Lister tous les événements",
        description = "Retourne la liste de tous les événements non supprimés. Endpoint public."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Liste des événements récupérée avec succès",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        )
    })
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        List<EventResponse> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/category/{category}")
    @Operation(
        summary = "Filtrer les événements par catégorie",
        description = "Retourne tous les événements d'une catégorie spécifique. Endpoint public."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Liste des événements filtrés par catégorie",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Catégorie invalide")
    })
    public ResponseEntity<List<EventResponse>> getEventsByCategory(
            @Parameter(
                description = "Type de catégorie",
                required = true,
                example = "MUSIC",
                schema = @Schema(implementation = CategoryType.class)
            )
            @PathVariable CategoryType category) {
        List<EventResponse> events = eventService.getEventsByCategory(category);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/status/{status}")
    @Operation(
        summary = "Filtrer les événements par statut",
        description = "Retourne tous les événements ayant un statut spécifique. Endpoint public."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Liste des événements filtrés par statut",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Statut invalide")
    })
    public ResponseEntity<List<EventResponse>> getEventsByStatus(
            @Parameter(
                description = "Statut de l'événement",
                required = true,
                example = "PUBLISHED",
                schema = @Schema(implementation = EventStatus.class)
            )
            @PathVariable EventStatus status) {
        List<EventResponse> events = eventService.getEventsByStatus(status);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/my-events")
    @Operation(
        summary = "Récupérer mes événements",
        description = "Retourne tous les événements créés par l'utilisateur connecté. Requiert une authentification JWT.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Liste de vos événements",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<List<EventResponse>> getMyEvents(
            @Parameter(hidden = true)
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        List<EventResponse> events = eventService.getMyEvents(currentUser);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Rechercher des événements",
        description = "Recherche des événements par mot-clé dans le titre, la description ou le lieu. Endpoint public."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Résultats de la recherche",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Mot-clé manquant ou invalide")
    })
    public ResponseEntity<List<EventResponse>> searchEvents(
            @Parameter(description = "Mot-clé de recherche", required = true, example = "concert")
            @RequestParam String keyword) {
        List<EventResponse> events = eventService.searchEvents(keyword);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/date-range")
    @Operation(
        summary = "Filtrer par plage de dates",
        description = "Retourne tous les événements se déroulant entre deux dates. Endpoint public."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Liste des événements dans la plage de dates",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Format de date invalide ou plage invalide")
    })
    public ResponseEntity<List<EventResponse>> getEventsBetweenDates(
            @Parameter(description = "Date de début", required = true, example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date start,
            @Parameter(description = "Date de fin", required = true, example = "2025-12-31")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date end) {

        List<EventResponse> events = eventService.getEventsBetweenDates(start, end);
        return ResponseEntity.ok(events);
    }

    @PatchMapping("/{id}/status")
    @Operation(
        summary = "Mettre à jour le statut d'un événement",
        description = "Permet de changer le statut d'un événement (DRAFT, PUBLISHED, CANCELLED). Accessible au propriétaire ou admin. Requiert une authentification JWT.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Statut mis à jour avec succès",
            content = @Content(schema = @Schema(implementation = EventResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Statut invalide"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès refusé - vous devez être le propriétaire ou admin"),
        @ApiResponse(responseCode = "404", description = "Événement non trouvé")
    })
    public ResponseEntity<EventResponse> updateEventStatus(
            @Parameter(description = "ID de l'événement", required = true, example = "1")
            @PathVariable Long id,
            @Parameter(
                description = "Nouveau statut",
                required = true,
                example = "PUBLISHED",
                schema = @Schema(implementation = EventStatus.class)
            )
            @RequestParam EventStatus status,
            @Parameter(hidden = true)
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        EventResponse response = eventService.updateEventStatus(id, status, currentUser);
        return ResponseEntity.ok(response);
    }
}