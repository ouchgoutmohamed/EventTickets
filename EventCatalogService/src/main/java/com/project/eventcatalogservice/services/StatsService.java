package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.api.responses.EventCategoryStatsResponse;
import com.project.eventcatalogservice.api.responses.EventTimelineStatsResponse;
import com.project.eventcatalogservice.api.responses.OrganizerStatsResponse;
import com.project.eventcatalogservice.domains.entities.Event;
import com.project.eventcatalogservice.domains.entities.Organizer;
import com.project.eventcatalogservice.domains.entities.TicketType;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.repositories.EventRepository;
import com.project.eventcatalogservice.repositories.OrganizerRepository;
import com.project.eventcatalogservice.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {

    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository; // AJOUTÉ : Essentiel pour trouver l'ID

    /**
     * Récupère les statistiques globales
     */
    @Transactional(readOnly = true)
    public OrganizerStatsResponse getOrganizerStats(CustomUserDetails userDetails) {
        // 1. Résolution robuste de l'ID Organisateur (comme dans EventService)
        Long organizerId = resolveOrganizerId(userDetails);

        log.info("Calcul des stats pour l'organisateur ID (BDD): {}", organizerId);

        // 2. Récupération des événements
        List<Event> events = eventRepository.findByOrganizer_Id(organizerId)
                .stream()
                .filter(e -> !e.isDeleted())
                .collect(Collectors.toList());

        // 3. Calculs des métriques
        Date today = new Date();
        LocalDate now = LocalDate.now();

        // Groupements
        Map<String, Integer> eventsByStatus = events.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getStatus() != null ? e.getStatus().name() : "UNKNOWN",
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        Map<String, Integer> eventsByCategory = events.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() != null ? e.getCategory().name() : "UNKNOWN",
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        Map<String, Integer> capacityByCategory = events.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() != null ? e.getCategory().name() : "UNKNOWN",
                        Collectors.summingInt(this::calculateEventCapacity)
                ));

        // Capacités
        int totalCapacity = events.stream().mapToInt(this::calculateEventCapacity).sum();
        double averageCapacity = events.isEmpty() ? 0 : (double) totalCapacity / events.size();

        // Événement populaire
        OrganizerStatsResponse.EventDetail mostPopular = events.stream()
                .max(Comparator.comparingInt(this::calculateEventCapacity))
                .map(e -> new OrganizerStatsResponse.EventDetail(
                        e.getId(),
                        e.getTitle(),
                        e.getCategory() != null ? e.getCategory().name() : "UNKNOWN",
                        calculateEventCapacity(e),
                        e.getDate() != null ? e.getDate().toString() : ""
                ))
                .orElse(null);

        // Périodes temporelles
        LocalDate startOfWeek = now.minusDays(now.getDayOfWeek().getValue() - 1);
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate startOfNextMonth = now.plusMonths(1).withDayOfMonth(1);
        LocalDate endOfNextMonth = startOfNextMonth.plusMonths(1).minusDays(1);
        LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
        LocalDate endOfLastMonth = startOfMonth.minusDays(1);

        int eventsThisWeek = countEventsInPeriod(events, startOfWeek, now.plusDays(6));
        int eventsThisMonth = countEventsInPeriod(events, startOfMonth, startOfNextMonth.minusDays(1));
        int eventsNextMonth = countEventsInPeriod(events, startOfNextMonth, endOfNextMonth);
        int eventsLastMonth = countEventsInPeriod(events, startOfLastMonth, endOfLastMonth);

        double growthRate = eventsLastMonth == 0 ? 0 : 
                ((double) (eventsThisMonth - eventsLastMonth) / eventsLastMonth) * 100;

        // Statuts spécifiques
        int activeEvents = (int) events.stream()
                .filter(e -> e.getStatus() != EventStatus.CANCELLED &&
                        e.getStatus() != EventStatus.COMPLETED &&
                        e.getDate() != null && !e.getDate().before(today))
                .count();

        int upcomingEvents = (int) events.stream()
                .filter(e -> e.getDate() != null && e.getDate().after(today))
                .count();

        int pastEvents = (int) events.stream()
                .filter(e -> e.getDate() != null && e.getDate().before(today))
                .count();

        int cancelledEvents = (int) events.stream()
                .filter(e -> e.getStatus() == EventStatus.CANCELLED)
                .count();

        return new OrganizerStatsResponse(
                events.size(),
                activeEvents,
                upcomingEvents,
                pastEvents,
                cancelledEvents,
                totalCapacity,
                averageCapacity,
                eventsByCategory,
                capacityByCategory,
                eventsByStatus,
                mostPopular,
                eventsThisMonth,
                eventsThisWeek,
                eventsNextMonth,
                growthRate
        );
    }

    /**
     * Récupère les stats par catégorie
     */
    public List<EventCategoryStatsResponse> getCategoryStats(CustomUserDetails userDetails) {
        Long organizerId = resolveOrganizerId(userDetails);

        List<Event> events = eventRepository.findByOrganizer_Id(organizerId)
                .stream()
                .filter(e -> !e.isDeleted())
                .collect(Collectors.toList());

        int totalEvents = events.size();

        return Arrays.stream(CategoryType.values())
                .map(category -> {
                    List<Event> categoryEvents = events.stream()
                            .filter(e -> e.getCategory() == category)
                            .collect(Collectors.toList());

                    int eventCount = categoryEvents.size();
                    int totalCapacity = categoryEvents.stream()
                            .mapToInt(this::calculateEventCapacity)
                            .sum();
                    double averageCapacity = eventCount == 0 ? 0 : (double) totalCapacity / eventCount;
                    double percentage = totalEvents == 0 ? 0 : (double) eventCount / totalEvents * 100;

                    return new EventCategoryStatsResponse(
                            category.name(),
                            eventCount,
                            totalCapacity,
                            averageCapacity,
                            percentage
                    );
                })
                .filter(stats -> stats.eventCount() > 0)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les stats temporelles (Timeline)
     */
    public EventTimelineStatsResponse getTimelineStats(CustomUserDetails userDetails) {
        Long organizerId = resolveOrganizerId(userDetails);

        List<Event> events = eventRepository.findByOrganizer_Id(organizerId)
                .stream()
                .filter(e -> !e.isDeleted() && e.getDate() != null)
                .collect(Collectors.toList());

        Date today = new Date();
        LocalDate now = LocalDate.now();

        int pastEvents = (int) events.stream().filter(e -> e.getDate().before(today)).count();
        
        int currentEvents = (int) events.stream().filter(e -> {
            LocalDate eventDate = e.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            return eventDate.equals(now);
        }).count();

        int upcomingEvents = (int) events.stream().filter(e -> e.getDate().after(today)).count();

        List<EventTimelineStatsResponse.MonthlyStats> monthlyDistribution = 
                calculateMonthlyDistribution(events, -12, 0);
        
        List<EventTimelineStatsResponse.MonthlyStats> upcomingMonthlyDistribution = 
                calculateMonthlyDistribution(events, 0, 6);

        return new EventTimelineStatsResponse(
                pastEvents,
                currentEvents,
                upcomingEvents,
                monthlyDistribution,
                upcomingMonthlyDistribution
        );
    }

    // ==================================================================================
    // MÉTHODES PRIVÉES (Helpers)
    // ==================================================================================

    /**
     * Méthode CRITIQUE : Récupère l'ID Organisateur à partir du User ID.
     * C'est ce qui manquait et causait le NullPointerException.
     */
    private Long resolveOrganizerId(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new SecurityException("Utilisateur non authentifié");
        }
        
        // On cherche l'organisateur en base via son userId (comme dans EventService)
        return organizerRepository.findByUserId(userDetails.getUserId())
                .map(Organizer::getId)
                .orElseThrow(() -> new SecurityException(
                    "Aucun compte organisateur trouvé pour l'utilisateur ID: " + userDetails.getUserId()));
    }

    private int calculateEventCapacity(Event event) {
        if (event.getTicketTypes() == null || event.getTicketTypes().isEmpty()) {
            return 0;
        }
        return event.getTicketTypes().stream()
                .filter(t -> !t.isDeleted())
                .mapToInt(TicketType::getQuantity)
                .sum();
    }
    
    private int countEventsInPeriod(List<Event> events, LocalDate start, LocalDate end) {
        return (int) events.stream()
                .filter(e -> e.getDate() != null)
                .filter(e -> {
                    LocalDate d = e.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                    return !d.isBefore(start) && !d.isAfter(end);
                })
                .count();
    }

    private List<EventTimelineStatsResponse.MonthlyStats> calculateMonthlyDistribution(
            List<Event> events, int startMonthOffset, int endMonthOffset) {

        YearMonth startMonth = YearMonth.now().plusMonths(startMonthOffset);
        YearMonth endMonth = YearMonth.now().plusMonths(endMonthOffset);

        Map<String, EventTimelineStatsResponse.MonthlyStats> monthlyMap = new HashMap<>();

        YearMonth current = startMonth;
        while (!current.isAfter(endMonth)) {
            monthlyMap.put(current.toString(), new EventTimelineStatsResponse.MonthlyStats(
                    current.toString(), 0, 0
            ));
            current = current.plusMonths(1);
        }

        events.stream()
                .filter(e -> e.getDate() != null)
                .forEach(e -> {
                    LocalDate eventDate = e.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                    YearMonth eventMonth = YearMonth.from(eventDate);

                    if (!eventMonth.isBefore(startMonth) && !eventMonth.isAfter(endMonth)) {
                        String monthKey = eventMonth.toString();
                        EventTimelineStatsResponse.MonthlyStats oldStats = monthlyMap.get(monthKey);
                        if (oldStats != null) {
                            monthlyMap.put(monthKey, new EventTimelineStatsResponse.MonthlyStats(
                                    monthKey,
                                    oldStats.eventCount() + 1,
                                    oldStats.totalCapacity() + calculateEventCapacity(e)
                            ));
                        }
                    }
                });

        return monthlyMap.values().stream()
                .sorted(Comparator.comparing(EventTimelineStatsResponse.MonthlyStats::month))
                .collect(Collectors.toList());
    }
}