package com.project.eventcatalogservice.api.requests;

public record CreateTicketTypeRequest(String name, double price, int quantity) {}