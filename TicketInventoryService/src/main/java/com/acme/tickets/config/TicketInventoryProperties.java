package com.acme.tickets.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;
import java.util.HashMap;
import java.util.Map;

/**
 * Propriétés de configuration pour le service d'inventaire de tickets.
 * Permet de configurer les paramètres métier via application.properties/yml.
 */
@Configuration
@ConfigurationProperties(prefix = "ticket-inventory")
@Validated
public class TicketInventoryProperties {

    /**
     * Nombre de minutes pendant lesquelles une réservation est maintenue avant expiration.
     */
    @Min(1)
    @Max(60)
    private int reservationHoldMinutes = 15;

    /**
     * Nombre maximum de tickets par réservation.
     */
    @Min(1)
    @Max(100)
    private int maxTicketsPerReservation = 10;

    /**
     * Expression cron pour le job de nettoyage des réservations expirées.
     */
    private String cleanupCron = "0 */5 * * * *";

    /**
     * Limites spécifiques par catégorie (override du max global).
     * Exemple dans application.properties:
     * ticket-inventory.category-max-per-reservation.MUSIC=6
     * ticket-inventory.category-max-per-reservation.SPORTS=4
     */
    private Map<String, Integer> categoryMaxPerReservation = new HashMap<>();

    public int getReservationHoldMinutes() {
        return reservationHoldMinutes;
    }

    public void setReservationHoldMinutes(int reservationHoldMinutes) {
        this.reservationHoldMinutes = reservationHoldMinutes;
    }

    public int getMaxTicketsPerReservation() {
        return maxTicketsPerReservation;
    }

    public void setMaxTicketsPerReservation(int maxTicketsPerReservation) {
        this.maxTicketsPerReservation = maxTicketsPerReservation;
    }

    public String getCleanupCron() {
        return cleanupCron;
    }

    public void setCleanupCron(String cleanupCron) {
        this.cleanupCron = cleanupCron;
    }

    public Map<String, Integer> getCategoryMaxPerReservation() {
        return categoryMaxPerReservation;
    }

    public void setCategoryMaxPerReservation(Map<String, Integer> categoryMaxPerReservation) {
        this.categoryMaxPerReservation = categoryMaxPerReservation;
    }
}
