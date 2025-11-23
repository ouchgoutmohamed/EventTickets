package com.acme.tickets.domain.entity;

import com.acme.tickets.domain.enums.ReservationStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité représentant une réservation de tickets pour un événement.
 */
@Entity
@Table(
    name = "reservation",
    indexes = {
        @Index(name = "idx_reservation_user_id", columnList = "user_id"),
        @Index(name = "idx_reservation_event_id", columnList = "event_id"),
        @Index(name = "idx_reservation_status", columnList = "status"),
        @Index(name = "idx_reservation_idempotency_key", columnList = "idempotency_key", unique = true)
    }
)
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status;

    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    public Reservation(Long eventId, Long userId, Integer quantity, ReservationStatus status) {
        this.eventId = eventId;
        this.userId = userId;
        this.quantity = quantity;
        this.status = status;
    }

    
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ========= Méthodes de domaine utilisées par les services =========

   
    public boolean isActive() {
        return this.status == ReservationStatus.PENDING || this.status == ReservationStatus.CONFIRMED;
    }

    /**
     * Indique si la réservation est expirée en fonction de sa date d'expiration.
     */
    public boolean isExpired() {
        return this.holdExpiresAt != null && Instant.now().isAfter(this.holdExpiresAt);
    }

    /**
     * Vérifie si la réservation peut être confirmée.
     * Elle doit être en statut PENDING et ne pas être expirée.
     */
    public boolean canBeConfirmed() {
        return this.status == ReservationStatus.PENDING && !isExpired();
    }

    /**
     * Confirme la réservation.
     */
    public void confirm() {
        this.status = ReservationStatus.CONFIRMED;
    }

    /**
     * Annule la réservation.
     */
    public void cancel() {
        this.status = ReservationStatus.CANCELED;
    }

    /**
     * Marque la réservation comme expirée.
     */
    public void expire() {
        this.status = ReservationStatus.EXPIRED;
    }

}
