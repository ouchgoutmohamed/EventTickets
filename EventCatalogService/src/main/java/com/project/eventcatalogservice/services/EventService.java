package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.api.reponses.ArtistResponse;
import com.project.eventcatalogservice.api.reponses.CategoryResponse;
import com.project.eventcatalogservice.api.reponses.EventImageResponse;
import com.project.eventcatalogservice.api.reponses.EventResponse;
import com.project.eventcatalogservice.api.reponses.TicketTypeResponse;
import com.project.eventcatalogservice.api.reponses.VenueResponse;
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
import com.project.eventcatalogservice.domains.entities.Artist;
import com.project.eventcatalogservice.domains.entities.EventImage;
import com.project.eventcatalogservice.domains.entities.TicketType;
import com.project.eventcatalogservice.api.requests.CreateArtistRequest;
import com.project.eventcatalogservice.api.requests.CreateEventImageRequest;
import com.project.eventcatalogservice.api.requests.CreateTicketTypeRequest;
import com.project.eventcatalogservice.repositories.ArtistRepository;
import com.project.eventcatalogservice.repositories.EventImageRepository;
import com.project.eventcatalogservice.repositories.TicketTypeRepository;
import com.project.eventcatalogservice.repositories.CategoryRepository;



import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final VenueRepository venueRepository;
    private final ArtistRepository artistRepository;
    private final EventImageRepository eventImageRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final CategoryRepository categoryRepository;

    /**
     * Créer un événement (status = DRAFT par défaut)
     */
    @Transactional
public EventResponse createEvent(CreateEventRequest request, CustomUserDetails currentUser) {

    // 1. Vérifier rôle
    if (!hasOrganizerRole(currentUser)) {
        throw new SecurityException("Only organizers can create events");
    }

    // 2. Récupérer / créer organizer
    Organizer organizer = organizerRepository.findByUserId(currentUser.getUserId())
            .orElseGet(() -> {
                Organizer org = new Organizer();
                org.setUserId(currentUser.getUserId());
                org.setEmail(currentUser.getEmail());
                return organizerRepository.save(org);
            });

    // 3. Créer le Venue
    Venue venue = new Venue();
    venue.setName(request.venue().name());
    venue.setAddress(request.venue().address());
    venue.setCity(request.venue().city());
    venue.setCapacity(request.venue().capacity());
    venue = venueRepository.save(venue);

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

    event.setArtists(new ArrayList<>());
    event.setTicketTypes(new ArrayList<>());
    event.setImages(new ArrayList<>());

    // 5. Créer / ajouter artistes
    if (request.artists() != null) {
        for (CreateArtistRequest artistReq : request.artists()) {
            Artist artist = new Artist();
            artist.setName(artistReq.name());
            artist.setGenre(artistReq.genre());
            artist.setCountry(artistReq.country());
            artist = artistRepository.save(artist);
            event.getArtists().add(artist);
        }
    }

    // 6. Créer tickets
    if (request.ticketTypes() != null) {
        for (CreateTicketTypeRequest t : request.ticketTypes()) {
            TicketType ticket = new TicketType();
            ticket.setTicketName(t.name());
            ticket.setPrice(t.price());
            ticket.setQuantity(t.quantity());
            ticket.setEvent(event);
            event.getTicketTypes().add(ticket);
        }
    }

    // 7. Créer images
    if (request.images() != null) {
        for (CreateEventImageRequest imgReq : request.images()) {
            EventImage img = new EventImage();
            img.setUrl(imgReq.url());
            img.setEvent(event);
            event.getImages().add(img);
        }
    }

    // 8. Sauvegarder event
    eventRepository.save(event);

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
    // 1. Catégorie
   
    CategoryResponse categoryResponse = null; 
    if (e.getCategory() != null) 
        { categoryResponse = new CategoryResponse(e.getCategory()); }

    // 2. Venue
    VenueResponse venueResponse = null;
    if (e.getVenue() != null) {
        venueResponse = new VenueResponse(
            e.getVenue().getId(),
            e.getVenue().getName(),
            e.getVenue().getAddress(),
            e.getVenue().getCity(),
            e.getVenue().getCapacity()
        );
    }

    // 3. Tickets
    List<TicketTypeResponse> ticketResponses = e.getTicketTypes() != null
        ? e.getTicketTypes().stream()
            .map(t -> new TicketTypeResponse(t.getId(), t.getTicketName(), t.getPrice(), t.getQuantity()))
            .toList()
        : new ArrayList<>();

    // 4. Images
    List<EventImageResponse> imageResponses = e.getImages() != null
        ? e.getImages().stream()
            .map(img -> new EventImageResponse(img.getId(), img.getUrl()))
            .toList()
        : new ArrayList<>();

    // 5. Artists
    List<ArtistResponse> artistResponses = e.getArtists() != null
        ? e.getArtists().stream()
            .map(a -> new ArtistResponse(a.getId(), a.getName(), a.getGenre()))
            .toList()
        : new ArrayList<>();

    // 6. Construire la réponse
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
        venueResponse,
        ticketResponses,
        imageResponses,
        artistResponses,
        e.isDeleted()
    );
}


}