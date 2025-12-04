package com.project.eventcatalogservice.api.responses;

import java.util.Map;

/**
 * Response DTO pour les statistiques globales de l'organisateur
 * Basé uniquement sur les données d'EventCatalogService (événements et capacités)
 * Les statistiques de vente réelles sont gérées par TicketInventoryService
 */
public record OrganizerStatsResponse(
    // Statistiques d'événements
    int totalEvents,
    int activeEvents,
    int upcomingEvents,
    int pastEvents,
    int cancelledEvents,
    
    // Statistiques de capacité
    int totalCapacity,
    double averageCapacityPerEvent,
    
    // Distribution par catégorie et statut
    Map<String, Integer> eventsByCategory,
    Map<String, Integer> capacityByCategory,
    Map<String, Integer> eventsByStatus,
    
    // Événement le plus populaire
    EventDetail mostPopularEvent,
    
    // Statistiques temporelles
    int eventsThisMonth,
    int eventsThisWeek,
    int eventsNextMonth,
    double growthRate
) {
    public record EventDetail(
        Long eventId,
        String title,
        String category,
        int capacity,
        String date
    ) {}
}
