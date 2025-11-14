package com.project.eventcatalogservice.api.requests;

import java.time.LocalDateTime;
import java.util.Date;

public record UpdateEventRequest(
        String title,
        String description,
        Date date,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status,
        Long categoryId,
        Long organizerId,
        Long venueId
) {
}
