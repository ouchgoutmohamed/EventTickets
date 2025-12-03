package com.project.eventcatalogservice.api.responses;

/**
 * Response DTO pour les statistiques par catégorie d'événement
 */
public record EventCategoryStatsResponse(
    String category,
    int eventCount,
    int totalCapacity,
    double averageCapacity,
    double percentageOfTotal
) {}
