package com.acme.tickets.domain.entity;

import com.acme.tickets.domain.enums.ReservationStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

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

    @Version
    @Column(name = "version")
    private Integer version;

    protected Reservation() {
        // Constructeur requis par JPA
    }

    public Reservation(Long eventId, Long userId, Integer quantity, ReservationStatus status) {
        this.eventId = eventId;
        this.userId = userId;
        this.quantity = quantity;
        this.status = status;
    }

    // ========== BUSINESS LOGIC (Rich Domain Model) ==========

    /**
     * Vérifie si cette réservation est active (non annulée/expirée).
     */
    public boolean isActive() {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    /**
     * Vérifie si cette réservation a expiré.
     */
    public boolean isExpired() {
        return holdExpiresAt != null && Instant.now().isAfter(holdExpiresAt);
    }

    /**
     * Vérifie si cette réservation peut être confirmée.
     */
    public boolean canBeConfirmed() {
        return status == ReservationStatus.PENDING && !isExpired();
    }

    /**
     * Vérifie si cette réservation peut être libérée/annulée.
     */
    public boolean canBeReleased() {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    /**
     * Confirme la réservation (transition d'état).
     * @throws IllegalStateException si la réservation ne peut pas être confirmée
     */
    public void confirm() {
        if (!canBeConfirmed()) {
            throw new IllegalStateException(
                String.format("Cannot confirm reservation %d in status %s", id, status)
            );
        }
        this.status = ReservationStatus.CONFIRMED;
    }

    /**
     * Annule la réservation (transition d'état).
     * @throws IllegalStateException si la réservation ne peut pas être annulée
     */
    public void cancel() {
        if (!canBeReleased()) {
            throw new IllegalStateException(
                String.format("Cannot cancel reservation %d in status %s", id, status)
            );
        }
        this.status = ReservationStatus.CANCELED;
    }

    /**
     * Marque la réservation comme expirée (transition d'état).
     * @throws IllegalStateException si la réservation ne peut pas expirer
     */
    public void expire() {
        if (status != ReservationStatus.PENDING) {
            throw new IllegalStateException(
                String.format("Cannot expire reservation %d in status %s", id, status)
            );
        }
        this.status = ReservationStatus.EXPIRED;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Reservation)) return false;
        Reservation that = (Reservation) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // Getters et Setters

    public Long getId() {
        return id;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public Instant getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(Instant holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
