package com.project.eventcatalogservice.api.reponses;


import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

public record EventResponse(
        Long id,
        String title,
        String description,
        Date date,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status,
        CategoryResponse category,
        Long organizerId,
        VenueResponse venue, 
        List<TicketTypeResponse> tickets,
        List<EventImageResponse> images,
        List<ArtistResponse> artists,
        boolean deleted
) {}


