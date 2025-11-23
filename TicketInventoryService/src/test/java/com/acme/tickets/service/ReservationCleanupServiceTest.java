package com.acme.tickets.service;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour ReservationCleanupService.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationCleanupService - Unit Tests")
class ReservationCleanupServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private ReservationCleanupService cleanupService;

    private Inventory mockInventory;

    @BeforeEach
    void setUp() {
        mockInventory = new Inventory(1L, 100);
        mockInventory.setReserved(20);
    }

    @Test
    @DisplayName("GIVEN expired reservations WHEN cleanup THEN reservations expired and stock released")
    void shouldCleanupExpiredReservations() {
        // GIVEN
        Reservation res1 = createReservation(1L, 1L, 42L, 5);
        Reservation res2 = createReservation(2L, 1L, 43L, 3);
        
        when(reservationRepository.findExpiredReservations(eq(ReservationStatus.PENDING), any(Instant.class)))
            .thenReturn(Arrays.asList(res1, res2));
        when(inventoryRepository.findById(1L))
            .thenReturn(Optional.of(mockInventory));

        // WHEN
        cleanupService.cleanupExpiredReservations();

        // THEN
        verify(reservationRepository, times(2)).save(any(Reservation.class));
        verify(inventoryRepository, times(2)).save(any(Inventory.class));
        
        // Verify reservations marked as EXPIRED
        ArgumentCaptor<Reservation> reservationCaptor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository, times(2)).save(reservationCaptor.capture());
        List<Reservation> savedReservations = reservationCaptor.getAllValues();
        assertThat(savedReservations)
            .allMatch(r -> r.getStatus() == ReservationStatus.EXPIRED);
    }

    @Test
    @DisplayName("GIVEN no expired reservations WHEN cleanup THEN nothing happens")
    void shouldDoNothingWhenNoExpiredReservations() {
        // GIVEN
        when(reservationRepository.findExpiredReservations(eq(ReservationStatus.PENDING), any(Instant.class)))
            .thenReturn(List.of());

        // WHEN
        cleanupService.cleanupExpiredReservations();

        // THEN
        verify(inventoryRepository, never()).save(any());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("GIVEN expired reservation WHEN cleanup THEN stock decremented correctly")
    void shouldDecrementStockCorrectly() {
        // GIVEN
        Reservation reservation = createReservation(1L, 1L, 42L, 5);
        
        when(reservationRepository.findExpiredReservations(eq(ReservationStatus.PENDING), any(Instant.class)))
            .thenReturn(List.of(reservation));
        when(inventoryRepository.findById(1L))
            .thenReturn(Optional.of(mockInventory));

        // WHEN
        cleanupService.cleanupExpiredReservations();

        // THEN
        ArgumentCaptor<Inventory> inventoryCaptor = ArgumentCaptor.forClass(Inventory.class);
        verify(inventoryRepository).save(inventoryCaptor.capture());
        Inventory savedInventory = inventoryCaptor.getValue();
        assertThat(savedInventory.getReserved()).isEqualTo(15); // 20 - 5
    }

    @Test
    @DisplayName("GIVEN cleanup error WHEN processing THEN continues with other reservations")
    void shouldContinueOnError() {
        // GIVEN
        Reservation res1 = createReservation(1L, 1L, 42L, 5);
        Reservation res2 = createReservation(2L, 2L, 43L, 3); // Different event
        
        when(reservationRepository.findExpiredReservations(eq(ReservationStatus.PENDING), any(Instant.class)))
            .thenReturn(Arrays.asList(res1, res2));
        when(inventoryRepository.findById(1L))
            .thenReturn(Optional.of(mockInventory));
        when(inventoryRepository.findById(2L))
            .thenReturn(Optional.empty()); // This will cause an error

        // WHEN
        cleanupService.cleanupExpiredReservations();

        // THEN: Should still process the first reservation
        verify(inventoryRepository).save(any(Inventory.class)); // Only for res1
    }

    private Reservation createReservation(Long id, Long eventId, Long userId, int quantity) {
        Reservation reservation = new Reservation(eventId, userId, quantity, ReservationStatus.PENDING);
        reservation.setHoldExpiresAt(Instant.now().minusSeconds(1)); // Expired
        try {
            var idField = Reservation.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(reservation, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return reservation;
    }
}
