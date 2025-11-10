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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // Création d'un événement (status initial = DRAFT)
    @PostMapping("create")
    public EventResponse createEvent(@RequestBody CreateEventRequest request,
                                     @AuthenticationPrincipal CustomUserDetails currentUser) {
        CreateEventRequest requestWithOrganizer = new CreateEventRequest(
                request.title(),
                request.description(),
                request.date(),
                request.startTime(),
                request.endTime(),
                request.status(),
                request.category(),
                currentUser.getOrganizerId(),
                request.venueId(),
                request.artistIds(),
                request.ticketTypes(),
                request.images()
        );

        return eventService.createEvent(requestWithOrganizer);
    }


    // Mise à jour d'un événement (uniquement si propriétaire)
    @PutMapping("/{id}")
    public EventResponse updateEvent(@PathVariable Long id,
                                     @RequestBody UpdateEventRequest request,
                                     @AuthenticationPrincipal CustomUserDetails currentUser) {
        return eventService.updateEvent(id, request, currentUser.getOrganizerId());
    }

    // Suppression logique (soft delete) (uniquement si propriétaire)
    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable Long id,
                            @AuthenticationPrincipal CustomUserDetails currentUser) {
        eventService.deleteEvent(id, currentUser.getOrganizerId());
    }

    // Récupérer un événement par ID
    @GetMapping("/{id}")
    public EventResponse getEvent(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    // Récupérer tous les événements non supprimés
    @GetMapping
    public List<EventResponse> getAllEvents() {
        return eventService.getAllEvents();
    }

    // Filtrer par catégorie (enum)
    @GetMapping("/category/{category}")
    public List<EventResponse> getEventsByCategory(@PathVariable CategoryType category) {
        return eventService.getEventsByCategory(category);
    }

    // Filtrer par status
    @GetMapping("/status/{status}")
    public List<EventResponse> getEventsByStatus(@PathVariable EventStatus status) {
        return eventService.getEventsByStatus(status);
    }

    // Filtrer par organisateur
    @GetMapping("/organizer/{organizerId}")
    public List<EventResponse> getEventsByOrganizer(@PathVariable Long organizerId) {
        return eventService.getEventsByOrganizer(organizerId);
    }

    // Recherche par mot-clé (title / description)
    @GetMapping("/search")
    public List<EventResponse> searchEvents(@RequestParam String keyword) {
        return eventService.searchEvents(keyword);
    }

    // Filtrer entre deux dates
    @GetMapping("/date")
    public List<EventResponse> getEventsBetweenDates(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date end
    ) {
        return eventService.getEventsBetweenDates(start, end);
    }

    // Mise à jour du status (DRAFT → PUBLISHED ou autre) (uniquement si propriétaire)
    @PatchMapping("/{id}/status")
    public EventResponse updateEventStatus(@PathVariable Long id,
                                           @RequestParam EventStatus status,
                                           @AuthenticationPrincipal CustomUserDetails currentUser) {
        return eventService.updateEventStatus(id, status, currentUser.getOrganizerId());
    }
}
