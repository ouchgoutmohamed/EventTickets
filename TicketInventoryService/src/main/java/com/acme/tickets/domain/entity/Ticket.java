package com.acme.tickets.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * Entité représentant un ticket émis suite à une réservation confirmée.
 */
@Entity
@Table(
    name = "ticket",
    indexes = {
        @Index(name = "idx_ticket_reservation_id", columnList = "reservation_id"),
        @Index(name = "idx_ticket_user_id", columnList = "user_id"),
        @Index(name = "idx_ticket_event_id", columnList = "event_id")
    }
)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "reservation_id", nullable = false)
    private Long reservationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Ticket() {
        // Constructeur requis par JPA
    }

    public Ticket(Long reservationId, Long userId, Long eventId, Integer quantity) {
        this.reservationId = reservationId;
        this.userId = userId;
        this.eventId = eventId;
        this.quantity = quantity;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Ticket)) return false;
        Ticket ticket = (Ticket) o;
        return id != null && Objects.equals(id, ticket.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // Getters et Setters

    public Long getId() {
        return id;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
