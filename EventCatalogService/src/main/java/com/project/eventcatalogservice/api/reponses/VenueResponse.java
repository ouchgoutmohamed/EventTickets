package com.project.eventcatalogservice.api.reponses;

public record VenueResponse(Long id, String name, String address
        , String city, int capacity
) {}

