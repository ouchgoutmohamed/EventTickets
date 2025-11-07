package com.acme.tickets.domain.repository;

import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des réservations de tickets.
 */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /**
     * Récupère toutes les réservations d'un utilisateur, triées par date de création décroissante.
     *
     * @param userId L'identifiant de l'utilisateur
     * @return Liste des réservations de l'utilisateur
     */
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Trouve une réservation par clé d'idempotence pour éviter les doublons.
     *
     * @param idempotencyKey La clé d'idempotence
     * @return La réservation correspondante si elle existe
     */
    Optional<Reservation> findByIdempotencyKey(String idempotencyKey);

    /**
     * Récupère les réservations expirées qui doivent être libérées.
     *
     * @param now La date actuelle
     * @return Liste des réservations PENDING expirées
     */
    @Query("SELECT r FROM Reservation r WHERE r.status = :status AND r.holdExpiresAt < :now")
    List<Reservation> findExpiredReservations(
        @Param("status") ReservationStatus status,
        @Param("now") Instant now
    );
}
