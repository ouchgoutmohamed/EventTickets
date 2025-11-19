package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.api.reponses.EventResponse;
import com.project.eventcatalogservice.api.requests.CreateEventRequest;
import com.project.eventcatalogservice.api.requests.UpdateEventRequest;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.security.CustomUserDetails;
import com.project.eventcatalogservice.services.EventService;
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
public class EventController {

    private final EventService eventService;

    /**
     * Créer un événement (ORGANIZER ou ADMIN uniquement)
     */
    @PostMapping("/create")
    public ResponseEntity<EventResponse> createEvent(
            @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        EventResponse response = eventService.createEvent(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Mettre à jour un événement (propriétaire ou ADMIN uniquement)
     */
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @RequestBody UpdateEventRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        EventResponse response = eventService.updateEvent(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Supprimer un événement (soft delete) - propriétaire ou ADMIN uniquement
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        eventService.deleteEvent(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    /**
     * Récupérer un événement par ID (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Long id) {
        EventResponse response = eventService.getEventById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Récupérer tous les événements (public)
     */
    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        List<EventResponse> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * Filtrer par catégorie (public)
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<EventResponse>> getEventsByCategory(@PathVariable CategoryType category) {
        List<EventResponse> events = eventService.getEventsByCategory(category);
        return ResponseEntity.ok(events);
    }

    /**
     * Filtrer par status (public)
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EventResponse>> getEventsByStatus(@PathVariable EventStatus status) {
        List<EventResponse> events = eventService.getEventsByStatus(status);
        return ResponseEntity.ok(events);
    }

    /**
     * Récupérer MES événements (utilisateur connecté)
     */
    @GetMapping("/my-events")
    public ResponseEntity<List<EventResponse>> getMyEvents(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        List<EventResponse> events = eventService.getMyEvents(currentUser);
        return ResponseEntity.ok(events);
    }

    /**
     * Rechercher des événements par mot-clé (public)
     */
    @GetMapping("/search")
    public ResponseEntity<List<EventResponse>> searchEvents(@RequestParam String keyword) {
        List<EventResponse> events = eventService.searchEvents(keyword);
        return ResponseEntity.ok(events);
    }

    /**
     * Filtrer par plage de dates (public)
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<EventResponse>> getEventsBetweenDates(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date end) {

        List<EventResponse> events = eventService.getEventsBetweenDates(start, end);
        return ResponseEntity.ok(events);
    }

    /**
     * Mettre à jour le status d'un événement (propriétaire ou ADMIN uniquement)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<EventResponse> updateEventStatus(
            @PathVariable Long id,
            @RequestParam EventStatus status,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }

        EventResponse response = eventService.updateEventStatus(id, status, currentUser);
        return ResponseEntity.ok(response);
    }
}