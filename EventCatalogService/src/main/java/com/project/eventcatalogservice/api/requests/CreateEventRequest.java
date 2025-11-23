package com.project.eventcatalogservice.api.requests;

import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.api.requests.CreateVenueRequest;
import com.project.eventcatalogservice.api.requests.CreateArtistRequest;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

public record CreateEventRequest(
        String title,
        String description,
        Date date,
        LocalDateTime startTime,
        LocalDateTime endTime,
        EventStatus status,
        CategoryType category,
        CreateVenueRequest venue,
        List<CreateArtistRequest> artists,   
        List<CreateTicketTypeRequest> ticketTypes,
        List<CreateEventImageRequest> images
) {
}
