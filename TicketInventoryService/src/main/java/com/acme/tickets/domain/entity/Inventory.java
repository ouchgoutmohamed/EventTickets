package com.acme.tickets.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "inventory")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
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

    public Inventory(Long eventId, Integer total) {
        this.eventId = eventId;
        this.total = total;
        this.reserved = 0;
        this.updatedAt = Instant.now();
    }
}
