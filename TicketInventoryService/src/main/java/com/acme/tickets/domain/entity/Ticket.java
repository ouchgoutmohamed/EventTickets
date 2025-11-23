package com.acme.tickets.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
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

}
