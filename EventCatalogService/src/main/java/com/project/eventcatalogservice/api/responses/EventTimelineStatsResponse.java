package com.project.eventcatalogservice.api.responses;

import java.util.List;

/**
 * Response DTO pour les statistiques temporelles des événements
 */
public record EventTimelineStatsResponse(
    int pastEvents,
    int currentEvents,
    int upcomingEvents,
    List<MonthlyStats> monthlyDistribution,
    List<MonthlyStats> upcomingMonthlyDistribution
) {
    public record MonthlyStats(
        String month,
        int eventCount,
        int totalCapacity
    ) {}
}
