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
import com.acme.tickets.exception.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
 * Tests unitaires améliorés pour TicketInventoryService.
 * Tests d'isolation avec couverture complète des cas limites et d'erreur.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TicketInventoryService - Enhanced Unit Tests")
class TicketInventoryServiceEnhancedTest {

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
        mockInventory = new Inventory(1L, 100);
        mockInventory.setReserved(10);
        validRequest = new ReserveRequest(1L, 42L, 2);
        
        when(properties.getReservationHoldMinutes()).thenReturn(15);
        when(properties.getMaxTicketsPerReservation()).thenReturn(10);
    }

    @Nested
    @DisplayName("Reserve Tickets - Edge Cases")
    class ReserveTicketsEdgeCases {

        @Test
        @DisplayName("GIVEN exact available stock WHEN reserve THEN succeeds")
        void shouldReserveWhenExactStockAvailable() {
            // GIVEN: exactly 90 tickets available
            ReserveRequest exactRequest = new ReserveRequest(1L, 42L, 90);
            Reservation savedReservation = createMockReservation(1L, 42L, 90, 999L);

            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenReturn(savedReservation);

            // WHEN
            ReserveResponse response = service.reserveTickets(exactRequest, null);

            // THEN
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(999L);
            verify(inventoryRepository).save(argThat(inv -> inv.getReserved() == 100));
        }

        @Test
        @DisplayName("GIVEN one more than available WHEN reserve THEN throws exception")
        void shouldThrowWhenOneLessThanAvailable() {
            // GIVEN: only 90 available, requesting 91
            ReserveRequest tooManyRequest = new ReserveRequest(1L, 42L, 91);
            
            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));

            // WHEN / THEN
            assertThatThrownBy(() -> service.reserveTickets(tooManyRequest, null))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("91")
                .hasMessageContaining("90");
        }

        @Test
        @DisplayName("GIVEN zero quantity request WHEN reserve THEN succeeds")
        void shouldHandleZeroQuantity() {
            // GIVEN
            ReserveRequest zeroRequest = new ReserveRequest(1L, 42L, 0);
            Reservation savedReservation = createMockReservation(1L, 42L, 0, 888L);

            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenReturn(savedReservation);

            // WHEN
            ReserveResponse response = service.reserveTickets(zeroRequest, null);

            // THEN
            assertThat(response).isNotNull();
            verify(inventoryRepository).save(argThat(inv -> inv.getReserved() == 10)); // unchanged
        }

        @Test
        @DisplayName("GIVEN inventory at full capacity WHEN reserve THEN throws exception")
        void shouldThrowWhenInventoryFull() {
            // GIVEN
            mockInventory.setReserved(100); // all reserved
            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));

            // WHEN / THEN
            assertThatThrownBy(() -> service.reserveTickets(validRequest, null))
                .isInstanceOf(InsufficientStockException.class)
                .satisfies(ex -> {
                    InsufficientStockException ise = (InsufficientStockException) ex;
                    assertThat(ise.getAvailable()).isEqualTo(0);
                });
        }

        @Test
        @DisplayName("GIVEN idempotency key for expired reservation WHEN reserve THEN creates new")
        void shouldCreateNewReservationWhenIdempotentOneExpired() {
            // GIVEN
            String idempotencyKey = "expired-key";
            Reservation expiredReservation = createMockReservation(1L, 42L, 2, 111L);
            expiredReservation.setStatus(ReservationStatus.EXPIRED);

            Reservation newReservation = createMockReservation(1L, 42L, 2, 222L);

            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                .thenReturn(Optional.of(expiredReservation));
            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenReturn(newReservation);

            // WHEN
            ReserveResponse response = service.reserveTickets(validRequest, idempotencyKey);

            // THEN
            assertThat(response.reservationId()).isEqualTo(222L); // new reservation
            verify(inventoryRepository).findByIdWithLock(1L); // should proceed with new reservation
        }
    }

    @Nested
    @DisplayName("Confirm Reservation - Edge Cases")
    class ConfirmReservationEdgeCases {

        @Test
        @DisplayName("GIVEN reservation about to expire WHEN confirm THEN succeeds")
        void shouldConfirmReservationAboutToExpire() {
            // GIVEN: reservation expires in 1 second
            Reservation reservation = createMockReservation(1L, 42L, 2, 123L);
            reservation.setHoldExpiresAt(Instant.now().plusSeconds(1));

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenReturn(reservation);

            // WHEN
            ConfirmResponse response = service.confirmReservation(new ConfirmRequest(123L));

            // THEN
            assertThat(response.status()).isEqualTo("CONFIRMED");
            verify(ticketRepository).save(any(Ticket.class));
        }

        @Test
        @DisplayName("GIVEN expired reservation WHEN confirm THEN throws exception")
        void shouldThrowWhenConfirmingExpiredReservation() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 2, 123L);
            reservation.setHoldExpiresAt(Instant.now().minusSeconds(1)); // expired

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(new ConfirmRequest(123L)))
                .isInstanceOf(ReservationExpiredException.class)
                .hasMessageContaining("123");
        }

        @Test
        @DisplayName("GIVEN CANCELED reservation WHEN confirm THEN throws exception")
        void shouldThrowWhenConfirmingCanceledReservation() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 2, 123L);
            reservation.setStatus(ReservationStatus.CANCELED);

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(new ConfirmRequest(123L)))
                .isInstanceOf(InvalidReservationStateException.class);
        }

        @Test
        @DisplayName("GIVEN CONFIRMED reservation WHEN confirm again THEN throws exception")
        void shouldThrowWhenConfirmingAlreadyConfirmed() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 2, 123L);
            reservation.setStatus(ReservationStatus.CONFIRMED);

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(new ConfirmRequest(123L)))
                .isInstanceOf(InvalidReservationStateException.class);
        }

        @Test
        @DisplayName("GIVEN nonexistent reservation WHEN confirm THEN throws exception")
        void shouldThrowWhenReservationNotFound() {
            // GIVEN
            when(reservationRepository.findById(999L))
                .thenReturn(Optional.empty());

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(new ConfirmRequest(999L)))
                .isInstanceOf(ReservationNotFoundException.class)
                .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("Release Reservation - Edge Cases")
    class ReleaseReservationEdgeCases {

        @Test
        @DisplayName("GIVEN PENDING reservation WHEN release THEN stock restored")
        void shouldRestoreStockWhenReleasingPending() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 5, 123L);
            reservation.setStatus(ReservationStatus.PENDING);

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));
            when(inventoryRepository.findById(1L))
                .thenReturn(Optional.of(mockInventory));

            // WHEN
            ReleaseResponse response = service.releaseReservation(new ReleaseRequest(123L));

            // THEN
            assertThat(response.status()).isEqualTo("CANCELED");
            verify(inventoryRepository).save(argThat(inv -> 
                inv.getReserved() == 5  // 10 - 5
            ));
        }

        @Test
        @DisplayName("GIVEN CONFIRMED reservation WHEN release THEN no stock change")
        void shouldNotRestoreStockWhenReleasingConfirmed() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 5, 123L);
            reservation.setStatus(ReservationStatus.CONFIRMED);

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));

            // WHEN
            ReleaseResponse response = service.releaseReservation(new ReleaseRequest(123L));

            // THEN
            assertThat(response.status()).isEqualTo("CANCELED");
            verify(inventoryRepository, never()).findById(any());
            verify(inventoryRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN EXPIRED reservation WHEN release THEN returns expired status")
        void shouldHandleExpiredReservation() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 2, 123L);
            reservation.setStatus(ReservationStatus.EXPIRED);

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));

            // WHEN
            ReleaseResponse response = service.releaseReservation(new ReleaseRequest(123L));

            // THEN
            assertThat(response.status()).isEqualTo("EXPIRED");
            verify(reservationRepository, never()).save(any()); // no change
        }

        @Test
        @DisplayName("GIVEN CANCELED reservation WHEN release again THEN idempotent")
        void shouldBeIdempotentWhenAlreadyCanceled() {
            // GIVEN
            Reservation reservation = createMockReservation(1L, 42L, 2, 123L);
            reservation.setStatus(ReservationStatus.CANCELED);

            when(reservationRepository.findById(123L))
                .thenReturn(Optional.of(reservation));

            // WHEN
            ReleaseResponse response = service.releaseReservation(new ReleaseRequest(123L));

            // THEN
            assertThat(response.status()).isEqualTo("CANCELED");
            verify(inventoryRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Get Availability - Edge Cases")
    class GetAvailabilityEdgeCases {

        @Test
        @DisplayName("GIVEN zero reserved WHEN getAvailability THEN returns full capacity")
        void shouldReturnFullCapacityWhenNothingReserved() {
            // GIVEN
            mockInventory.setReserved(0);
            when(inventoryRepository.findById(1L))
                .thenReturn(Optional.of(mockInventory));

            // WHEN
            AvailabilityResponse response = service.getAvailability(1L);

            // THEN
            assertThat(response.total()).isEqualTo(100);
            assertThat(response.available()).isEqualTo(100);
        }

        @Test
        @DisplayName("GIVEN fully reserved WHEN getAvailability THEN returns zero available")
        void shouldReturnZeroWhenFullyReserved() {
            // GIVEN
            mockInventory.setReserved(100);
            when(inventoryRepository.findById(1L))
                .thenReturn(Optional.of(mockInventory));

            // WHEN
            AvailabilityResponse response = service.getAvailability(1L);

            // THEN
            assertThat(response.total()).isEqualTo(100);
            assertThat(response.available()).isEqualTo(0);
        }

        @Test
        @DisplayName("GIVEN nonexistent event WHEN getAvailability THEN throws exception")
        void shouldThrowWhenInventoryNotFound() {
            // GIVEN
            when(inventoryRepository.findById(999L))
                .thenReturn(Optional.empty());

            // WHEN / THEN
            assertThatThrownBy(() -> service.getAvailability(999L))
                .isInstanceOf(InventoryNotFoundException.class)
                .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("Get User Reservations - Edge Cases")
    class GetUserReservationsEdgeCases {

        @Test
        @DisplayName("GIVEN user with no reservations WHEN getUserReservations THEN returns empty list")
        void shouldReturnEmptyListWhenNoReservations() {
            // GIVEN
            when(reservationRepository.findByUserIdOrderByCreatedAtDesc(999L))
                .thenReturn(List.of());

            // WHEN
            UserReservationsResponse response = service.getUserReservations(999L);

            // THEN
            assertThat(response.items()).isEmpty();
        }

        @Test
        @DisplayName("GIVEN user with multiple reservations WHEN getUserReservations THEN returns all")
        void shouldReturnAllReservationsForUser() {
            // GIVEN
            Reservation r1 = createMockReservation(1L, 42L, 2, 1L);
            Reservation r2 = createMockReservation(2L, 42L, 3, 2L);
            Reservation r3 = createMockReservation(3L, 42L, 1, 3L);
            r2.setStatus(ReservationStatus.CONFIRMED);
            r3.setStatus(ReservationStatus.CANCELED);

            when(reservationRepository.findByUserIdOrderByCreatedAtDesc(42L))
                .thenReturn(List.of(r1, r2, r3));

            // WHEN
            UserReservationsResponse response = service.getUserReservations(42L);

            // THEN
            assertThat(response.items()).hasSize(3);
            assertThat(response.items())
                .extracting(UserReservationsItem::status)
                .containsExactly("PENDING", "CONFIRMED", "CANCELED");
        }
    }

    @Nested
    @DisplayName("Idempotency Tests")
    class IdempotencyTests {

        @Test
        @DisplayName("GIVEN same idempotency key twice WHEN reserve THEN same reservation returned")
        void shouldReturnSameReservationForSameIdempotencyKey() {
            // GIVEN
            String idempotencyKey = "unique-123";
            Reservation existingReservation = createMockReservation(1L, 42L, 2, 456L);

            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                .thenReturn(Optional.of(existingReservation));

            // WHEN
            ReserveResponse response1 = service.reserveTickets(validRequest, idempotencyKey);
            ReserveResponse response2 = service.reserveTickets(validRequest, idempotencyKey);

            // THEN
            assertThat(response1.reservationId()).isEqualTo(response2.reservationId());
            verify(inventoryRepository, never()).findByIdWithLock(any());
            verify(reservationRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN null idempotency key WHEN reserve THEN creates new reservation")
        void shouldCreateNewReservationWhenNoIdempotencyKey() {
            // GIVEN
            Reservation savedReservation = createMockReservation(1L, 42L, 2, 123L);

            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenReturn(savedReservation);

            // WHEN
            ReserveResponse response = service.reserveTickets(validRequest, null);

            // THEN
            assertThat(response.reservationId()).isEqualTo(123L);
            verify(reservationRepository, never()).findByIdempotencyKey(any());
        }
    }

    @Nested
    @DisplayName("Expiration Handling Tests")
    class ExpirationHandlingTests {

        @Test
        @DisplayName("GIVEN reservation WHEN created THEN expiration set correctly")
        void shouldSetExpirationTimeCorrectly() {
            // GIVEN
            when(inventoryRepository.findByIdWithLock(1L))
                .thenReturn(Optional.of(mockInventory));
            
            ArgumentCaptor<Reservation> reservationCaptor = ArgumentCaptor.forClass(Reservation.class);
            Reservation savedReservation = createMockReservation(1L, 42L, 2, 123L);
            when(reservationRepository.save(reservationCaptor.capture()))
                .thenReturn(savedReservation);

            // WHEN
            Instant beforeCreate = Instant.now();
            service.reserveTickets(validRequest, null);
            Instant afterCreate = Instant.now();

            // THEN
            Reservation captured = reservationCaptor.getValue();
            assertThat(captured.getHoldExpiresAt())
                .isAfter(beforeCreate.plusSeconds(14 * 60)) // at least 14 minutes
                .isBefore(afterCreate.plusSeconds(16 * 60)); // at most 16 minutes
        }
    }

    // Helper method to create mock reservations with ID
    private Reservation createMockReservation(Long eventId, Long userId, int quantity, Long id) {
        Reservation reservation = new Reservation(eventId, userId, quantity, ReservationStatus.PENDING);
        reservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
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
