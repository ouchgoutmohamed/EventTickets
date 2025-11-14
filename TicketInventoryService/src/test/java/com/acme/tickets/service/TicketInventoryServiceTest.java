package com.acme.tickets.service;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.ReserveRequest;
import com.acme.tickets.dto.ReserveResponse;
import com.acme.tickets.exception.InsufficientStockException;
import com.acme.tickets.exception.InventoryNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour TicketInventoryService.
 * Utilise Mockito pour isoler la logique métier.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TicketInventoryService - Tests Unitaires")
class TicketInventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private TicketRepository ticketRepository;

    @InjectMocks
    private TicketInventoryService service;

    private Inventory mockInventory;
    private ReserveRequest validRequest;

    @BeforeEach
    void setUp() {
        // Inventaire avec 100 tickets, 10 réservés
        mockInventory = new Inventory(1L, 100);
        mockInventory.setReserved(10);

        // Requête valide
        validRequest = new ReserveRequest(1L, 42L, 2);
    }

    @Test
    @DisplayName("GIVEN stock disponible WHEN reserve THEN réservation créée")
    void shouldReserveTicketsWhenStockAvailable() {
        // GIVEN
        Reservation savedReservation = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
        // Utiliser reflection pour simuler l'ID JPA généré
        try {
            var idField = Reservation.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(savedReservation, 123L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(inventoryRepository.findByIdWithLock(1L))
            .thenReturn(Optional.of(mockInventory));
        when(reservationRepository.save(any(Reservation.class)))
            .thenReturn(savedReservation);

        // WHEN
        ReserveResponse response = service.reserveTickets(validRequest, null);

        // THEN
        assertThat(response).isNotNull();
        assertThat(response.reservationId()).isEqualTo(123L);
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.holdExpiresAt()).isNotNull();

        // Vérifier que le stock a été décrémenté
        verify(inventoryRepository).save(argThat(inv ->
            inv.getReserved() == 12  // 10 + 2
        ));
    }

    @Test
    @DisplayName("GIVEN stock insuffisant WHEN reserve THEN exception levée")
    void shouldThrowExceptionWhenInsufficientStock() {
        // GIVEN
        mockInventory.setReserved(99);  // Seulement 1 ticket dispo
        when(inventoryRepository.findByIdWithLock(1L))
            .thenReturn(Optional.of(mockInventory));

        // WHEN / THEN
        assertThatThrownBy(() -> service.reserveTickets(validRequest, null))
            .isInstanceOf(InsufficientStockException.class)
            .hasMessageContaining("Stock insuffisant")
            .satisfies(ex -> {
                InsufficientStockException ise = (InsufficientStockException) ex;
                assertThat(ise.getRequested()).isEqualTo(2);
                assertThat(ise.getAvailable()).isEqualTo(1);
            });

        // Le stock ne doit PAS être modifié
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("GIVEN inventaire inexistant WHEN reserve THEN exception levée")
    void shouldThrowExceptionWhenInventoryNotFound() {
        // GIVEN
        when(inventoryRepository.findByIdWithLock(999L))
            .thenReturn(Optional.empty());

        ReserveRequest invalidRequest = new ReserveRequest(999L, 42L, 2);

        // WHEN / THEN
        assertThatThrownBy(() -> service.reserveTickets(invalidRequest, null))
            .isInstanceOf(InventoryNotFoundException.class)
            .hasMessageContaining("999");
    }

    @Test
    @DisplayName("GIVEN idempotency key existante WHEN reserve THEN réservation existante retournée")
    void shouldReturnExistingReservationWhenIdempotencyKeyExists() {
        // GIVEN
        String idempotencyKey = "unique-key-123";
        Reservation existingReservation = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
        
        // Utiliser reflection pour simuler l'ID JPA
        try {
            var idField = Reservation.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(existingReservation, 456L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(reservationRepository.findByIdempotencyKey(idempotencyKey))
            .thenReturn(Optional.of(existingReservation));

        // WHEN
        ReserveResponse response = service.reserveTickets(validRequest, idempotencyKey);

        // THEN
        assertThat(response.reservationId()).isEqualTo(456L);

        // Pas de nouvelle réservation créée
        verify(inventoryRepository, never()).findByIdWithLock(any());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("GIVEN 2 réservations concurrentes WHEN reserve THEN optimistic lock gère")
    void shouldHandleConcurrentReservations() {
        // TODO: Test d'intégration avec vraie DB pour vérifier @Version
        // Ce test nécessite @SpringBootTest avec une base H2 in-memory
    }

    // TODO: Ajouter tests pour:
    // - confirmReservation() avec réservation expirée
    // - releaseReservation() avec différents statuts
    // - getUserReservations() avec tri correct
}
