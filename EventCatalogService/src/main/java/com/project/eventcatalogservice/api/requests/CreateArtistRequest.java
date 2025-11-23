package com.project.eventcatalogservice.api.requests;

public record CreateArtistRequest(
    String name,
    String genre,
    String country
) {}