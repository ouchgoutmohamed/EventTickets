package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.api.reponses.CategoryResponse;
import com.project.eventcatalogservice.api.reponses.EventResponse;
import com.project.eventcatalogservice.api.requests.CreateEventRequest;
import com.project.eventcatalogservice.api.requests.UpdateEventRequest;
import com.project.eventcatalogservice.domains.entities.Event;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.repositories.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    //  Créer un événement (status = DRAFT par défaut)
    public EventResponse createEvent(CreateEventRequest request) {
        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setDate(request.date());
        event.setCategory(request.category());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setStatus(EventStatus.DRAFT); // toujours initialisé à DRAFT
        event.setDeleted(false); // soft delete par défaut
        // Organizer est déjà lié via request.organizerId
        // Tickets et images peuvent être ajoutés ici si request contient les listes

        eventRepository.save(event);
        return mapToResponse(event);
    }

    //  Mettre à jour un événement (uniquement si propriétaire)
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request, Long organizerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new RuntimeException("Access denied: Not the event owner");
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

    //  Suppression logique (soft delete)
    public void deleteEvent(Long eventId, Long organizerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new RuntimeException("Access denied: Not the event owner");
        }

        event.setDeleted(true);
        eventRepository.save(event);
    }

    //  Récupérer un événement par ID
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        if (event.isDeleted()) {
            throw new EntityNotFoundException("Event not found");
        }

        return mapToResponse(event);
    }

    //  Récupérer tous les événements non supprimés
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Filtrer par catégorie
    public List<EventResponse> getEventsByCategory(CategoryType category) {
        return eventRepository.findByCategory(category)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Filtrer par status
    public List<EventResponse> getEventsByStatus(EventStatus status) {
        return eventRepository.findByStatus(status)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Filtrer par organizer
    public List<EventResponse> getEventsByOrganizer(Long organizerId) {
        return eventRepository.findByOrganizer_Id(organizerId)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Recherche par mot-clé
    public List<EventResponse> searchEvents(String keyword) {
        return eventRepository.findByTitleContainingIgnoreCase(keyword)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Filtrer par dates
    public List<EventResponse> getEventsBetweenDates(Date start, Date end) {
        return eventRepository.findByDateBetween(start, end)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Mise à jour du status (uniquement si propriétaire)
    public EventResponse updateEventStatus(Long eventId, EventStatus newStatus, Long organizerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new RuntimeException("Access denied: Not the event owner");
        }

        event.setStatus(newStatus);
        eventRepository.save(event);

        return mapToResponse(event);
    }

    //  Mapper Event → EventResponse
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
