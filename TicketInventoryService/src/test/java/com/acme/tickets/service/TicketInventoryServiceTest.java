package com.acme.tickets.service;

import com.acme.tickets.config.TicketInventoryProperties;
import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.entity.Ticket;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.*;
import com.acme.tickets.exception.InsufficientStockException;
import com.acme.tickets.exception.InventoryNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour TicketInventoryService.
 * Utilise Mockito pour isoler la logique métier.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TicketInventoryService - Tests Unitaires")
class TicketInventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TicketInventoryProperties properties;

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
        
        // Mock properties
        when(properties.getReservationHoldMinutes()).thenReturn(15);
        when(properties.getMaxTicketsPerReservation()).thenReturn(10);
    }

    @Test
    @DisplayName("GIVEN stock disponible WHEN reserve THEN réservation créée")
    void shouldReserveTicketsWhenStockAvailable() {
        // GIVEN
        Reservation savedReservation = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
        savedReservation.setHoldExpiresAt(Instant.now().plusSeconds(900)); // 15 minutes
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
        assertThat(response.holdExpiresAt()).isNotNull().isAfter(Instant.now());

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

    @Test
    @DisplayName("GIVEN réservation PENDING WHEN confirm THEN statut CONFIRMED")
    void shouldConfirmPendingReservation() {
        // GIVEN
        Reservation pendingReservation = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
        pendingReservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
        
        try {
            var idField = Reservation.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(pendingReservation, 123L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(reservationRepository.findById(123L))
            .thenReturn(Optional.of(pendingReservation));
        when(reservationRepository.save(any(Reservation.class)))
            .thenReturn(pendingReservation);

        // WHEN
        ConfirmRequest request = new ConfirmRequest(123L);
        ConfirmResponse response = service.confirmReservation(request);

        // THEN
        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo("CONFIRMED");
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("GIVEN réservation PENDING WHEN release THEN stock libéré et statut CANCELED")
    void shouldReleaseReservationAndRestoreStock() {
        // GIVEN
        Reservation pendingReservation = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
        pendingReservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
        
        try {
            var idField = Reservation.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(pendingReservation, 123L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(reservationRepository.findById(123L))
            .thenReturn(Optional.of(pendingReservation));
        when(inventoryRepository.findById(1L))
            .thenReturn(Optional.of(mockInventory));

        // WHEN
        ReleaseRequest request = new ReleaseRequest(123L);
        ReleaseResponse response = service.releaseReservation(request);

        // THEN
        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo("CANCELED");
        
        // Vérifier que le stock a été libéré
        verify(inventoryRepository).save(argThat(inv ->
            inv.getReserved() == 8  // 10 - 2
        ));
    }

    @Test
    @DisplayName("GIVEN plusieurs réservations WHEN getUserReservations THEN liste retournée")
    void shouldGetUserReservations() {
        // GIVEN
        Reservation res1 = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
        Reservation res2 = new Reservation(2L, 42L, 3, ReservationStatus.CONFIRMED);
        
        when(reservationRepository.findByUserIdOrderByCreatedAtDesc(42L))
            .thenReturn(List.of(res1, res2));

        // WHEN
        UserReservationsResponse response = service.getUserReservations(42L);

        // THEN
        assertThat(response).isNotNull();
        assertThat(response.items()).hasSize(2);
    }

    @Test
    @DisplayName("GIVEN inventaire WHEN getAvailability THEN disponibilité correcte")
    void shouldGetAvailability() {
        // GIVEN
        when(inventoryRepository.findById(1L))
            .thenReturn(Optional.of(mockInventory));

        // WHEN
        AvailabilityResponse response = service.getAvailability(1L);

        // THEN
        assertThat(response).isNotNull();
        assertThat(response.eventId()).isEqualTo(1L);
        assertThat(response.total()).isEqualTo(100);
        assertThat(response.available()).isEqualTo(90); // 100 - 10
    }
}
