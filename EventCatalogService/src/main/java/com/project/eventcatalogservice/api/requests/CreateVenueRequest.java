package com.project.eventcatalogservice.api.requests;

public record CreateVenueRequest(
        String name,
        String address,
        String city,
        int capacity
) {}
