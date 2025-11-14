package com.acme.tickets.domain.repository;

import com.acme.tickets.domain.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des tickets confirmés.
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /**
     * Récupère tous les tickets d'un utilisateur.
     *
     * @param userId L'identifiant de l'utilisateur
     * @return Liste des tickets de l'utilisateur
     */
    List<Ticket> findByUserId(Long userId);

    /**
     * Récupère tous les tickets liés à une réservation.
     *
     * @param reservationId L'identifiant de la réservation
     * @return Liste des tickets de la réservation
     */
    List<Ticket> findByReservationId(Long reservationId);
}
