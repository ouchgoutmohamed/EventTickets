package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.api.responses.EventCategoryStatsResponse;
import com.project.eventcatalogservice.api.responses.EventTimelineStatsResponse;
import com.project.eventcatalogservice.api.responses.OrganizerStatsResponse;
import com.project.eventcatalogservice.security.CustomUserDetails;
import com.project.eventcatalogservice.services.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour les statistiques des événements
 * Note: Fournit uniquement les statistiques d'événements et capacités (EventCatalogService)
 * Les statistiques de vente sont gérées par TicketInventoryService
 */
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    /**
     * Récupère toutes les statistiques d'événements pour l'organisateur connecté
     */
    @GetMapping("/organizer")
    public ResponseEntity<OrganizerStatsResponse> getOrganizerStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        OrganizerStatsResponse stats = statsService.getOrganizerStats(userDetails);
        return ResponseEntity.ok(stats);
    }

    /**
     * Récupère les statistiques détaillées pour chaque catégorie d'événement
     */
    @GetMapping("/organizer/categories")
    public ResponseEntity<List<EventCategoryStatsResponse>> getCategoryStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<EventCategoryStatsResponse> stats = statsService.getCategoryStats(userDetails);
        return ResponseEntity.ok(stats);
    }

    /**
     * Récupère la distribution temporelle des événements
     */
    @GetMapping("/organizer/timeline")
    public ResponseEntity<EventTimelineStatsResponse> getTimelineStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        EventTimelineStatsResponse stats = statsService.getTimelineStats(userDetails);
        return ResponseEntity.ok(stats);
    }
}
