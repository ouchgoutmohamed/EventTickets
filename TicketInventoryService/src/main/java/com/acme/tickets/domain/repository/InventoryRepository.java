package com.acme.tickets.domain.repository;

import com.acme.tickets.domain.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

/**
 * Repository pour la gestion des inventaires de tickets.
 * Utilise le verrouillage optimiste via @Version pour éviter les conflits de concurrence.
 */
@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    /**
     * Récupère l'inventaire avec un verrou pessimiste pour les opérations critiques.
     * Utilisé lors de réservations simultanées pour garantir la cohérence.
     *
     * @param eventId L'identifiant de l'événement
     * @return L'inventaire avec un verrou exclusif
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.eventId = :eventId")
    Optional<Inventory> findByIdWithLock(Long eventId);
}
