package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.api.reponses.CategoryResponse;
import com.project.eventcatalogservice.api.reponses.EventResponse;
import com.project.eventcatalogservice.api.requests.CreateEventRequest;
import com.project.eventcatalogservice.api.requests.UpdateEventRequest;
import com.project.eventcatalogservice.domains.entities.Event;
import com.project.eventcatalogservice.domains.entities.Organizer;
import com.project.eventcatalogservice.domains.entities.Venue;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.repositories.EventRepository;
import com.project.eventcatalogservice.repositories.OrganizerRepository;
import com.project.eventcatalogservice.repositories.VenueRepository;
import com.project.eventcatalogservice.security.CustomUserDetails;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final VenueRepository venueRepository;

    /**
     * Créer un événement (status = DRAFT par défaut)
     */
    @Transactional
    public EventResponse createEvent(CreateEventRequest request, CustomUserDetails currentUser) {

        // 1. Vérifier que l'utilisateur a le rôle ORGANIZER ou ADMIN
        if (!hasOrganizerRole(currentUser)) {
            throw new SecurityException("Only organizers can create events");
        }

        // 2. Récupérer ou créer l'organizer associé à cet utilisateur
        Organizer organizer = organizerRepository.findByUserId(currentUser.getUserId())
                .orElseGet(() -> {
                    Organizer org = new Organizer();
                    org.setUserId(currentUser.getUserId());
                    org.setEmail(currentUser.getEmail());
                    return organizerRepository.save(org);
                });

        // 3. Récupérer le venue
        Venue venue = venueRepository.findById(request.venueId())
                .orElseThrow(() -> new EntityNotFoundException("Venue not found with id: " + request.venueId()));

        // 4. Créer l'événement
        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setDate(request.date());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setStatus(request.status() != null ? request.status() : EventStatus.DRAFT);
        event.setCategory(request.category());
        event.setVenue(venue);
        event.setOrganizer(organizer);
        event.setDeleted(false);

        eventRepository.save(event);

        // 5. Retourner la réponse
        return mapToResponse(event);
    }

    /**
     * Mettre à jour un événement (uniquement si propriétaire ou admin)
     */
    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request, CustomUserDetails currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + eventId));

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if (!isOwnerOrAdmin(event, currentUser)) {
            throw new SecurityException("Access denied: Not the event owner");
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setDate(request.date());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());

        if (request.status() != null) {
            event.setStatus(EventStatus.valueOf(request.status().toUpperCase()));
        }

        eventRepository.save(event);
        return mapToResponse(event);
    }

    /**
     * Suppression logique (soft delete)
     */
    @Transactional
    public void deleteEvent(Long eventId, CustomUserDetails currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + eventId));

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if (!isOwnerOrAdmin(event, currentUser)) {
            throw new SecurityException("Access denied: Not the event owner");
        }

        event.setDeleted(true);
        eventRepository.save(event);
    }

    /**
     * Récupérer un événement par ID
     */
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + id));

        if (event.isDeleted()) {
            throw new EntityNotFoundException("Event not found with id: " + id);
        }

        return mapToResponse(event);
    }

    /**
     * Récupérer tous les événements non supprimés
     */
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filtrer par catégorie
     */
    public List<EventResponse> getEventsByCategory(CategoryType category) {
        return eventRepository.findByCategory(category)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filtrer par status
     */
    public List<EventResponse> getEventsByStatus(EventStatus status) {
        return eventRepository.findByStatus(status)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filtrer par organizer (récupérer les événements de l'utilisateur connecté)
     */
    public List<EventResponse> getMyEvents(CustomUserDetails currentUser) {
        Organizer organizer = organizerRepository.findByUserId(currentUser.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Organizer not found for user: " + currentUser.getUserId()));

        return eventRepository.findByOrganizer_Id(organizer.getId())
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Recherche par mot-clé
     */
    public List<EventResponse> searchEvents(String keyword) {
        return eventRepository.findByTitleContainingIgnoreCase(keyword)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filtrer par dates
     */
    public List<EventResponse> getEventsBetweenDates(Date start, Date end) {
        return eventRepository.findByDateBetween(start, end)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Mise à jour du status (uniquement si propriétaire ou admin)
     */
    @Transactional
    public EventResponse updateEventStatus(Long eventId, EventStatus newStatus, CustomUserDetails currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + eventId));

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if (!isOwnerOrAdmin(event, currentUser)) {
            throw new SecurityException("Access denied: Not the event owner");
        }

        event.setStatus(newStatus);
        eventRepository.save(event);

        return mapToResponse(event);
    }

    /**
     * Vérifier si l'utilisateur a le rôle ORGANIZER ou ADMIN
     */
    private boolean hasOrganizerRole(CustomUserDetails user) {
        return user.getRoleName().equalsIgnoreCase("organisateur")
                || user.getRoleName().equalsIgnoreCase("admin");
    }


    /**
     * Vérifier si l'utilisateur est le propriétaire de l'événement ou admin
     */
    private boolean isOwnerOrAdmin(Event event, CustomUserDetails user) {
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return true;
        }

        Organizer organizer = organizerRepository.findByUserId(user.getUserId()).orElse(null);
        return organizer != null && event.getOrganizer().getId().equals(organizer.getId());
    }

    /**
     * Mapper Event → EventResponse
     */
    private EventResponse mapToResponse(Event e) {
        CategoryResponse categoryResponse = null;
        if (e.getCategory() != null) {
            categoryResponse = new CategoryResponse(e.getCategory());
        }

        return new EventResponse(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getDate(),
                e.getStartTime(),
                e.getEndTime(),
                e.getStatus().name(),
                categoryResponse,
                e.getOrganizer() != null ? e.getOrganizer().getId() : null,
                e.getVenue() != null ? e.getVenue().getId() : null,
                null, // ticket types → à compléter
                null, // images → à compléter
                e.isDeleted()
        );
    }
}