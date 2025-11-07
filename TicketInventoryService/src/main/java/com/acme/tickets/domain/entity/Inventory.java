package com.acme.tickets.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * Entité représentant l'inventaire des tickets pour un événement.
 * Gère le stock total et le nombre de tickets réservés avec verrouillage optimiste.
 */
@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "total", nullable = false)
    private Integer total;

    @Column(name = "reserved", nullable = false)
    private Integer reserved = 0;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Inventory() {
        // Constructeur requis par JPA
    }

    public Inventory(Long eventId, Integer total) {
        this.eventId = eventId;
        this.total = total;
        this.reserved = 0;
        this.updatedAt = Instant.now();
    }

    /**
     * Calcule le nombre de tickets disponibles (non réservés).
     * @return total - reserved
     */
    @Transient
    public int getAvailable() {
        return (total != null ? total : 0) - (reserved != null ? reserved : 0);
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Inventory)) return false;
        Inventory inventory = (Inventory) o;
        return Objects.equals(eventId, inventory.eventId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId);
    }

    // Getters et Setters

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public Integer getTotal() {
        return total;
    }

    public void setTotal(Integer total) {
        this.total = total;
    }

    public Integer getReserved() {
        return reserved;
    }

    public void setReserved(Integer reserved) {
        this.reserved = reserved;
    }

    public Integer getVersion() {
        return version;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
