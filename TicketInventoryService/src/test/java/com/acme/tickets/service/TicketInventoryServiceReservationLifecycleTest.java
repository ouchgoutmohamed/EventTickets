package com.acme.tickets.service;

import com.acme.tickets.config.TicketInventoryProperties;
import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.entity.Ticket;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.ConfirmRequest;
import com.acme.tickets.dto.ConfirmResponse;
import com.acme.tickets.dto.ReleaseRequest;
import com.acme.tickets.dto.ReleaseResponse;
import com.acme.tickets.exception.InvalidReservationStateException;
import com.acme.tickets.exception.ReservationExpiredException;
import com.acme.tickets.exception.ReservationNotFoundException;
import com.acme.tickets.integration.EventCatalogClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour TicketInventoryService - Confirm and Release flows (INT-017, INT-018).
 * Utilise JUnit 5 (Jupiter) et Mockito pour isoler la logique métier.
 * Aucun contexte Spring - test pur de la logique métier.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TicketInventoryService - Reservation Lifecycle (Confirm/Release) Tests")
class TicketInventoryServiceReservationLifecycleTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TicketInventoryProperties properties;

    @Mock
    private EventCatalogClient eventCatalogClient;

    @Captor
    private ArgumentCaptor<Reservation> reservationCaptor;

    @Captor
    private ArgumentCaptor<Inventory> inventoryCaptor;

    @Captor
    private ArgumentCaptor<Ticket> ticketCaptor;

    private TicketInventoryService service;

    @BeforeEach
    void setUp() {
        service = new TicketInventoryService(
                inventoryRepository,
                reservationRepository,
                ticketRepository,
                properties,
                eventCatalogClient
        );
    }

    /**
     * Helper method to set the ID field on a Reservation via reflection.
     */
    private void setReservationId(Reservation reservation, Long id) {
        try {
            Field idField = Reservation.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(reservation, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set reservation ID", e);
        }
    }

    /**
     * Helper to create a PENDING reservation that is not expired.
     */
    private Reservation createPendingReservation(Long id, Long eventId, Long userId, int quantity) {
        Reservation reservation = new Reservation(eventId, userId, quantity, ReservationStatus.PENDING);
        setReservationId(reservation, id);
        reservation.setHoldExpiresAt(Instant.now().plusSeconds(900)); // expires in 15 minutes
        return reservation;
    }

    /**
     * Helper to create a PENDING reservation that is expired.
     */
    private Reservation createExpiredPendingReservation(Long id, Long eventId, Long userId, int quantity) {
        Reservation reservation = new Reservation(eventId, userId, quantity, ReservationStatus.PENDING);
        setReservationId(reservation, id);
        reservation.setHoldExpiresAt(Instant.now().minusSeconds(60)); // expired 1 minute ago
        return reservation;
    }

    // ========================================================================
    // INT-017: Confirm Reservation Tests
    // ========================================================================
    @Nested
    @DisplayName("INT-017: Confirm Reservation")
    class ConfirmReservationTests {

        @Test
        @DisplayName("TC1: GIVEN PENDING reservation not expired WHEN confirm THEN status=CONFIRMED, Ticket created, changes persisted")
        void shouldConfirmReservation_WhenPendingAndNotExpired() {
            // GIVEN
            Long reservationId = 100L;
            Long eventId = 1L;
            Long userId = 42L;
            int quantity = 3;
            
            Reservation pendingReservation = createPendingReservation(reservationId, eventId, userId, quantity);
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            ConfirmResponse response = service.confirmReservation(request);

            // THEN
            // Verify response
            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(ReservationStatus.CONFIRMED.name());
            
            // Verify reservation was saved with CONFIRMED status
            verify(reservationRepository).save(reservationCaptor.capture());
            Reservation savedReservation = reservationCaptor.getValue();
            assertThat(savedReservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
            assertThat(savedReservation.getId()).isEqualTo(reservationId);
            
            // Verify Ticket was created and linked to reservation
            verify(ticketRepository).save(ticketCaptor.capture());
            Ticket createdTicket = ticketCaptor.getValue();
            assertThat(createdTicket.getReservationId()).isEqualTo(reservationId);
            assertThat(createdTicket.getUserId()).isEqualTo(userId);
            assertThat(createdTicket.getEventId()).isEqualTo(eventId);
            assertThat(createdTicket.getQuantity()).isEqualTo(quantity);
        }

        @Test
        @DisplayName("TC2: GIVEN reservationId does not exist WHEN confirm THEN throw ReservationNotFoundException")
        void shouldThrowReservationNotFoundException_WhenReservationDoesNotExist() {
            // GIVEN
            Long nonExistentId = 999L;
            ConfirmRequest request = new ConfirmRequest(nonExistentId);
            
            when(reservationRepository.findById(nonExistentId))
                    .thenReturn(Optional.empty());

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(request))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessageContaining(nonExistentId.toString());
            
            // Verify no save operations occurred
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("TC3: GIVEN already CONFIRMED reservation WHEN confirm THEN throw InvalidReservationStateException")
        void shouldThrowInvalidReservationStateException_WhenAlreadyConfirmed() {
            // GIVEN
            Long reservationId = 100L;
            
            Reservation confirmedReservation = new Reservation(1L, 42L, 2, ReservationStatus.CONFIRMED);
            setReservationId(confirmedReservation, reservationId);
            confirmedReservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(confirmedReservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(request))
                    .isInstanceOf(InvalidReservationStateException.class)
                    .hasMessageContaining(reservationId.toString())
                    .hasMessageContaining(ReservationStatus.CONFIRMED.name());
            
            // Verify no save operations occurred
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("TC4a: GIVEN EXPIRED reservation WHEN confirm THEN throw ReservationExpiredException")
        void shouldThrowReservationExpiredException_WhenReservationExpired() {
            // GIVEN
            Long reservationId = 100L;
            
            // PENDING but expired
            Reservation expiredReservation = createExpiredPendingReservation(reservationId, 1L, 42L, 2);
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(expiredReservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(request))
                    .isInstanceOf(ReservationExpiredException.class)
                    .hasMessageContaining(reservationId.toString());
            
            // Verify no save operations occurred
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("TC4b: GIVEN CANCELED reservation WHEN confirm THEN throw InvalidReservationStateException")
        void shouldThrowInvalidReservationStateException_WhenReservationCanceled() {
            // GIVEN
            Long reservationId = 100L;
            
            Reservation canceledReservation = new Reservation(1L, 42L, 2, ReservationStatus.CANCELED);
            setReservationId(canceledReservation, reservationId);
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(canceledReservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(request))
                    .isInstanceOf(InvalidReservationStateException.class)
                    .hasMessageContaining(reservationId.toString())
                    .hasMessageContaining(ReservationStatus.CANCELED.name());
            
            // Verify no save operations occurred
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("TC4c: GIVEN reservation with status EXPIRED WHEN confirm THEN throw InvalidReservationStateException")
        void shouldThrowInvalidReservationStateException_WhenStatusIsExpired() {
            // GIVEN
            Long reservationId = 100L;
            
            Reservation expiredStatusReservation = new Reservation(1L, 42L, 2, ReservationStatus.EXPIRED);
            setReservationId(expiredStatusReservation, reservationId);
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(expiredStatusReservation));

            // WHEN / THEN
            assertThatThrownBy(() -> service.confirmReservation(request))
                    .isInstanceOf(InvalidReservationStateException.class)
                    .hasMessageContaining(reservationId.toString())
                    .hasMessageContaining(ReservationStatus.EXPIRED.name());
            
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(ticketRepository, never()).save(any(Ticket.class));
        }
    }

    // ========================================================================
    // INT-018: Release Reservation Tests
    // ========================================================================
    @Nested
    @DisplayName("INT-018: Release Reservation")
    class ReleaseReservationTests {

        @Test
        @DisplayName("TC5: GIVEN PENDING reservation WHEN release THEN status=CANCELED, inventory.reserved decreased by quantity")
        void shouldReleaseReservation_WhenPending() {
            // GIVEN
            Long reservationId = 200L;
            Long eventId = 5L;
            Long userId = 42L;
            int reservedQuantity = 4;
            int initialInventoryReserved = 50;
            
            Reservation pendingReservation = createPendingReservation(reservationId, eventId, userId, reservedQuantity);
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(initialInventoryReserved);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(inventoryRepository.findById(eventId))
                    .thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            ReleaseResponse response = service.releaseReservation(request);

            // THEN
            // Verify response
            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(ReservationStatus.CANCELED.name());
            
            // Verify reservation status updated to CANCELED
            verify(reservationRepository).save(reservationCaptor.capture());
            Reservation savedReservation = reservationCaptor.getValue();
            assertThat(savedReservation.getStatus()).isEqualTo(ReservationStatus.CANCELED);
            
            // Verify inventory.reserved was decreased by reservation quantity
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getReserved()).isEqualTo(initialInventoryReserved - reservedQuantity);
        }

        @Test
        @DisplayName("TC5b: GIVEN PENDING reservation WHEN release THEN inventory available increases")
        void shouldIncreaseAvailableStock_WhenReleasingPendingReservation() {
            // GIVEN
            Long reservationId = 201L;
            Long eventId = 10L;
            int quantity = 5;
            int totalCapacity = 100;
            int initialReserved = 30;
            int expectedAvailable = totalCapacity - initialReserved + quantity; // 100 - 30 + 5 = 75
            
            Reservation pendingReservation = createPendingReservation(reservationId, eventId, 1L, quantity);
            
            Inventory inventory = new Inventory(eventId, totalCapacity);
            inventory.setReserved(initialReserved);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(inventoryRepository.findById(eventId))
                    .thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            service.releaseReservation(request);

            // THEN
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getAvailable()).isEqualTo(expectedAvailable);
            assertThat(savedInventory.getReserved()).isEqualTo(initialReserved - quantity);
        }

        @Test
        @DisplayName("TC6: GIVEN CONFIRMED reservation WHEN release THEN status=CANCELED, inventory NOT modified (business rule)")
        void shouldReleaseCancelConfirmedReservation_ButNotModifyInventory() {
            // GIVEN
            // Per the service code: CONFIRMED reservations can be released but inventory is NOT modified
            // (only PENDING reservations release inventory)
            Long reservationId = 300L;
            Long eventId = 5L;
            
            Reservation confirmedReservation = new Reservation(eventId, 42L, 3, ReservationStatus.CONFIRMED);
            setReservationId(confirmedReservation, reservationId);
            confirmedReservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(50);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(confirmedReservation));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            ReleaseResponse response = service.releaseReservation(request);

            // THEN
            // Status should be CANCELED (reservation was active and got canceled)
            assertThat(response.status()).isEqualTo(ReservationStatus.CANCELED.name());
            
            // Verify reservation was saved with CANCELED status
            verify(reservationRepository).save(reservationCaptor.capture());
            assertThat(reservationCaptor.getValue().getStatus()).isEqualTo(ReservationStatus.CANCELED);
            
            // Verify inventory was NOT modified (not looked up, not saved)
            verify(inventoryRepository, never()).findById(any());
            verify(inventoryRepository, never()).save(any(Inventory.class));
        }

        @Test
        @DisplayName("TC6b: GIVEN already CANCELED reservation WHEN release THEN return current status without modifications")
        void shouldReturnCurrentStatus_WhenReservationAlreadyCanceled() {
            // GIVEN
            Long reservationId = 400L;
            
            Reservation canceledReservation = new Reservation(1L, 42L, 2, ReservationStatus.CANCELED);
            setReservationId(canceledReservation, reservationId);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(canceledReservation));

            // WHEN
            ReleaseResponse response = service.releaseReservation(request);

            // THEN
            assertThat(response.status()).isEqualTo(ReservationStatus.CANCELED.name());
            
            // Verify no modifications were made
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(inventoryRepository, never()).save(any(Inventory.class));
        }

        @Test
        @DisplayName("TC6c: GIVEN already EXPIRED reservation WHEN release THEN return current status without modifications")
        void shouldReturnCurrentStatus_WhenReservationAlreadyExpired() {
            // GIVEN
            Long reservationId = 500L;
            
            Reservation expiredReservation = new Reservation(1L, 42L, 2, ReservationStatus.EXPIRED);
            setReservationId(expiredReservation, reservationId);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(expiredReservation));

            // WHEN
            ReleaseResponse response = service.releaseReservation(request);

            // THEN
            assertThat(response.status()).isEqualTo(ReservationStatus.EXPIRED.name());
            
            // Verify no modifications were made
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(inventoryRepository, never()).save(any(Inventory.class));
        }

        @Test
        @DisplayName("GIVEN non-existing reservationId WHEN release THEN throw ReservationNotFoundException")
        void shouldThrowReservationNotFoundException_WhenReleasingNonExistentReservation() {
            // GIVEN
            Long nonExistentId = 999L;
            ReleaseRequest request = new ReleaseRequest(nonExistentId);
            
            when(reservationRepository.findById(nonExistentId))
                    .thenReturn(Optional.empty());

            // WHEN / THEN
            assertThatThrownBy(() -> service.releaseReservation(request))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessageContaining(nonExistentId.toString());
            
            // Verify no save operations occurred
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(inventoryRepository, never()).save(any(Inventory.class));
        }

        @Test
        @DisplayName("GIVEN PENDING reservation WHEN release THEN inventory reserved does not go negative (defensive)")
        void shouldNotAllowNegativeReserved_WhenReleasingReservation() {
            // GIVEN - Edge case: inventory reserved is less than reservation quantity (data inconsistency)
            Long reservationId = 600L;
            Long eventId = 5L;
            int reservedQuantity = 10;
            int inventoryReserved = 5; // Less than reservation quantity (inconsistent state)
            
            Reservation pendingReservation = createPendingReservation(reservationId, eventId, 1L, reservedQuantity);
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(inventoryReserved);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(inventoryRepository.findById(eventId))
                    .thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            service.releaseReservation(request);

            // THEN
            // Defensive behavior: reserved should be set to 0, not negative
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getReserved()).isGreaterThanOrEqualTo(0);
        }
    }

    // ========================================================================
    // Additional edge cases
    // ========================================================================
    @Nested
    @DisplayName("Edge Cases: Lifecycle consistency")
    class LifecycleEdgeCasesTests {

        @Test
        @DisplayName("Confirm should persist both reservation and ticket atomically")
        void confirmShouldPersistBothReservationAndTicket() {
            // GIVEN
            Long reservationId = 700L;
            Reservation pendingReservation = createPendingReservation(reservationId, 1L, 42L, 2);
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            service.confirmReservation(request);

            // THEN - Both should be saved
            verify(reservationRepository, times(1)).save(any(Reservation.class));
            verify(ticketRepository, times(1)).save(any(Ticket.class));
        }

        @Test
        @DisplayName("Release of PENDING should update both reservation and inventory")
        void releasePendingShouldUpdateBothReservationAndInventory() {
            // GIVEN
            Long reservationId = 800L;
            Long eventId = 1L;
            Reservation pendingReservation = createPendingReservation(reservationId, eventId, 42L, 3);
            
            Inventory inventory = new Inventory(eventId, 100);
            inventory.setReserved(20);
            
            ReleaseRequest request = new ReleaseRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(inventoryRepository.findById(eventId))
                    .thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            service.releaseReservation(request);

            // THEN - Both should be saved
            verify(inventoryRepository, times(1)).save(any(Inventory.class));
            verify(reservationRepository, times(1)).save(any(Reservation.class));
        }

        @Test
        @DisplayName("Ticket created on confirm should have all required fields populated")
        void ticketShouldHaveAllFieldsPopulated_OnConfirm() {
            // GIVEN
            Long reservationId = 900L;
            Long eventId = 10L;
            Long userId = 55L;
            int quantity = 4;
            
            Reservation pendingReservation = createPendingReservation(reservationId, eventId, userId, quantity);
            
            ConfirmRequest request = new ConfirmRequest(reservationId);
            
            when(reservationRepository.findById(reservationId))
                    .thenReturn(Optional.of(pendingReservation));
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            service.confirmReservation(request);

            // THEN
            verify(ticketRepository).save(ticketCaptor.capture());
            Ticket ticket = ticketCaptor.getValue();
            
            assertThat(ticket.getReservationId()).isEqualTo(reservationId);
            assertThat(ticket.getEventId()).isEqualTo(eventId);
            assertThat(ticket.getUserId()).isEqualTo(userId);
            assertThat(ticket.getQuantity()).isEqualTo(quantity);
        }
    }
}
