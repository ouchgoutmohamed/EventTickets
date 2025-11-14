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
        Long venueId,
        List<TicketTypeResponse> tickets,
        List<EventImageResponse> images,
        boolean deleted
) {}

