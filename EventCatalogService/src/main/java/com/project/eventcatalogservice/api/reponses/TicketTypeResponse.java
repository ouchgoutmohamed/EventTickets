package com.project.eventcatalogservice.api.reponses;

public record TicketTypeResponse(Long id, String name, double price, int quantity) {}