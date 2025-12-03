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
import com.acme.tickets.exception.ReservationExpiredException;
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
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TicketInventoryService - Reservation Expiration Logic.
 * 
 * Tests verify the 15-minute hold expiration behavior for PENDING reservations
 * by directly manipulating holdExpiresAt timestamps (past/future) rather than
 * relying on real time delays.
 * 
 * Uses JUnit 5 (Jupiter) and Mockito for isolated unit testing without Spring context.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TicketInventoryService - Reservation Expiration Logic")
class ReservationExpirationTest {

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

    // Test data constants
    private static final Long RESERVATION_ID = 1L;
    private static final Long EVENT_ID = 100L;
    private static final Long USER_ID = 42L;
    private static final int QUANTITY = 3;
    private static final int TOTAL_TICKETS = 100;

    @BeforeEach
    void setUp() {
        service = new TicketInventoryService(
            inventoryRepository,
            reservationRepository,
            ticketRepository,
            properties,
            eventCatalogClient
        );

        // Default mock properties
        when(properties.getReservationHoldMinutes()).thenReturn(15);
        when(properties.getMaxTicketsPerReservation()).thenReturn(10);
        when(properties.getCategoryMaxPerReservation()).thenReturn(Map.of());

        // Default mock for EventCatalogClient
        when(eventCatalogClient.getEventById(anyLong())).thenReturn(Map.of(
            "id", EVENT_ID,
            "name", "Test Event",
            "category", "MUSIC"
        ));
    }

    /**
     * Helper to create a PENDING reservation with a specific expiration time.
     */
    private Reservation createPendingReservation(Instant holdExpiresAt) {
        Reservation reservation = new Reservation(EVENT_ID, USER_ID, QUANTITY, ReservationStatus.PENDING);
        setReservationId(reservation, RESERVATION_ID);
        reservation.setHoldExpiresAt(holdExpiresAt);
        // Manually trigger onCreate to set timestamps
        setCreatedAndUpdatedAt(reservation);
        return reservation;
    }

    /**
     * Helper to create an inventory for testing.
     */
    private Inventory createInventory(int reserved) {
        Inventory inventory = new Inventory(EVENT_ID, TOTAL_TICKETS);
        inventory.setReserved(reserved);
        return inventory;
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
     * Helper method to set createdAt and updatedAt fields via reflection.
     */
    private void setCreatedAndUpdatedAt(Reservation reservation) {
        try {
            Instant now = Instant.now();
            Field createdAtField = Reservation.class.getDeclaredField("createdAt");
            createdAtField.setAccessible(true);
            createdAtField.set(reservation, now);

            Field updatedAtField = Reservation.class.getDeclaredField("updatedAt");
            updatedAtField.setAccessible(true);
            updatedAtField.set(reservation, now);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set timestamps", e);
        }
    }

    // ========================================================================
    // Scenario 1: Confirming an EXPIRED reservation (holdExpiresAt in the past)
    // ========================================================================

    @Nested
    @DisplayName("Scenario 1: Confirming an expired PENDING reservation")
    class ConfirmExpiredReservationTests {

        @Test
        @DisplayName("Should throw ReservationExpiredException when holdExpiresAt is in the past")
        void confirmReservation_WhenExpired_ShouldThrowReservationExpiredException() {
            // Given: A PENDING reservation with holdExpiresAt 1 minute in the past
            Instant expiredTime = Instant.now().minus(1, ChronoUnit.MINUTES);
            Reservation expiredReservation = createPendingReservation(expiredTime);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(expiredReservation));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When & Then: Expect ReservationExpiredException
            assertThatThrownBy(() -> service.confirmReservation(request))
                .isInstanceOf(ReservationExpiredException.class)
                .hasMessageContaining(String.valueOf(RESERVATION_ID));

            // Verify no ticket was created
            verify(ticketRepository, never()).save(any(Ticket.class));

            // Verify reservation was not updated to CONFIRMED
            verify(reservationRepository, never()).save(reservationCaptor.capture());
        }

        @Test
        @DisplayName("Should throw ReservationExpiredException when holdExpiresAt is exactly at expiration boundary")
        void confirmReservation_WhenExactlyExpired_ShouldThrowReservationExpiredException() {
            // Given: A PENDING reservation with holdExpiresAt exactly 15 minutes ago
            Instant expiredTime = Instant.now().minus(15, ChronoUnit.MINUTES);
            Reservation expiredReservation = createPendingReservation(expiredTime);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(expiredReservation));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When & Then
            assertThatThrownBy(() -> service.confirmReservation(request))
                .isInstanceOf(ReservationExpiredException.class);

            // Verify no ticket was created
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("Should not create tickets when reservation is expired")
        void confirmReservation_WhenExpired_ShouldNotCreateTickets() {
            // Given: An expired reservation
            Instant expiredTime = Instant.now().minus(30, ChronoUnit.MINUTES);
            Reservation expiredReservation = createPendingReservation(expiredTime);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(expiredReservation));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When
            try {
                service.confirmReservation(request);
            } catch (ReservationExpiredException e) {
                // Expected
            }

            // Then: Verify no ticket was generated
            verify(ticketRepository, never()).save(any(Ticket.class));
            verifyNoInteractions(ticketRepository);
        }
    }

    // ========================================================================
    // Scenario 2: Releasing an EXPIRED PENDING reservation
    // ========================================================================

    @Nested
    @DisplayName("Scenario 2: Releasing an expired PENDING reservation")
    class ReleaseExpiredReservationTests {

        @Test
        @DisplayName("Should cancel and release inventory when releasing expired PENDING reservation")
        void releaseReservation_WhenExpiredPending_ShouldCancelAndReleaseInventory() {
            // Given: A PENDING reservation with holdExpiresAt in the past
            Instant expiredTime = Instant.now().minus(20, ChronoUnit.MINUTES);
            Reservation expiredReservation = createPendingReservation(expiredTime);

            Inventory inventory = createInventory(QUANTITY); // reserved = QUANTITY

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(expiredReservation));
            when(inventoryRepository.findById(EVENT_ID))
                .thenReturn(Optional.of(inventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(inventoryRepository.save(any(Inventory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ReleaseRequest request = new ReleaseRequest(RESERVATION_ID);

            // When
            ReleaseResponse response = service.releaseReservation(request);

            // Then: Status should become CANCELED (current implementation behavior)
            assertThat(response.status()).isEqualTo(ReservationStatus.CANCELED.name());

            // Verify reservation was saved with CANCELED status
            verify(reservationRepository).save(reservationCaptor.capture());
            Reservation savedReservation = reservationCaptor.getValue();
            assertThat(savedReservation.getStatus()).isEqualTo(ReservationStatus.CANCELED);

            // Verify inventory.reserved was decremented (released)
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getReserved()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should update inventory correctly when releasing expired reservation")
        void releaseReservation_WhenExpired_ShouldUpdateInventoryCorrectly() {
            // Given: An expired PENDING reservation with 5 tickets reserved
            int reservedQuantity = 5;
            Instant expiredTime = Instant.now().minus(1, ChronoUnit.HOURS);
            Reservation expiredReservation = new Reservation(EVENT_ID, USER_ID, reservedQuantity, ReservationStatus.PENDING);
            setReservationId(expiredReservation, RESERVATION_ID);
            expiredReservation.setHoldExpiresAt(expiredTime);
            setCreatedAndUpdatedAt(expiredReservation);

            // Inventory with 10 reserved tickets total
            Inventory inventory = createInventory(10);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(expiredReservation));
            when(inventoryRepository.findById(EVENT_ID))
                .thenReturn(Optional.of(inventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(inventoryRepository.save(any(Inventory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ReleaseRequest request = new ReleaseRequest(RESERVATION_ID);

            // When
            service.releaseReservation(request);

            // Then: Inventory reserved should be decremented by 5
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getReserved()).isEqualTo(5); // 10 - 5 = 5
            assertThat(savedInventory.getAvailable()).isEqualTo(TOTAL_TICKETS - 5);
        }

        @Test
        @DisplayName("Should handle release of already CANCELED/EXPIRED reservation gracefully")
        void releaseReservation_WhenAlreadyCanceled_ShouldReturnCurrentStatus() {
            // Given: A reservation that is already CANCELED
            Reservation canceledReservation = new Reservation(EVENT_ID, USER_ID, QUANTITY, ReservationStatus.CANCELED);
            setReservationId(canceledReservation, RESERVATION_ID);
            setCreatedAndUpdatedAt(canceledReservation);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(canceledReservation));

            ReleaseRequest request = new ReleaseRequest(RESERVATION_ID);

            // When
            ReleaseResponse response = service.releaseReservation(request);

            // Then: Should return current CANCELED status without updating
            assertThat(response.status()).isEqualTo(ReservationStatus.CANCELED.name());

            // Verify no inventory update was made
            verify(inventoryRepository, never()).save(any(Inventory.class));
            // Verify reservation was not saved again
            verify(reservationRepository, never()).save(any(Reservation.class));
        }
    }

    // ========================================================================
    // Scenario 3: Confirming a PENDING reservation still valid (holdExpiresAt in future)
    // ========================================================================

    @Nested
    @DisplayName("Scenario 3: Confirming a valid (non-expired) PENDING reservation")
    class ConfirmValidReservationTests {

        @Test
        @DisplayName("Should confirm successfully when holdExpiresAt is in the future")
        void confirmReservation_WhenNotExpired_ShouldSucceed() {
            // Given: A PENDING reservation with holdExpiresAt 10 minutes in the future
            Instant futureExpiration = Instant.now().plus(10, ChronoUnit.MINUTES);
            Reservation validReservation = createPendingReservation(futureExpiration);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(validReservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> {
                    Ticket t = inv.getArgument(0);
                    // Simulate ID generation
                    try {
                        Field idField = Ticket.class.getDeclaredField("id");
                        idField.setAccessible(true);
                        idField.set(t, 1L);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                    return t;
                });

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When
            ConfirmResponse response = service.confirmReservation(request);

            // Then: Confirmation should succeed
            assertThat(response.status()).isEqualTo(ReservationStatus.CONFIRMED.name());

            // Verify reservation was updated to CONFIRMED
            verify(reservationRepository).save(reservationCaptor.capture());
            Reservation savedReservation = reservationCaptor.getValue();
            assertThat(savedReservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);

            // Verify ticket was created
            verify(ticketRepository).save(ticketCaptor.capture());
            Ticket savedTicket = ticketCaptor.getValue();
            assertThat(savedTicket.getReservationId()).isEqualTo(RESERVATION_ID);
            assertThat(savedTicket.getUserId()).isEqualTo(USER_ID);
            assertThat(savedTicket.getEventId()).isEqualTo(EVENT_ID);
            assertThat(savedTicket.getQuantity()).isEqualTo(QUANTITY);
        }

        @Test
        @DisplayName("Should confirm when holdExpiresAt is exactly 1 second in the future")
        void confirmReservation_WhenJustBeforeExpiration_ShouldSucceed() {
            // Given: A reservation about to expire (1 second from now)
            Instant almostExpired = Instant.now().plus(1, ChronoUnit.SECONDS);
            Reservation validReservation = createPendingReservation(almostExpired);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(validReservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When
            ConfirmResponse response = service.confirmReservation(request);

            // Then: Confirmation should succeed
            assertThat(response.status()).isEqualTo(ReservationStatus.CONFIRMED.name());

            // Verify ticket was created
            verify(ticketRepository).save(any(Ticket.class));
        }

        @Test
        @DisplayName("Should create tickets with correct data when confirming valid reservation")
        void confirmReservation_WhenValid_ShouldCreateTicketsWithCorrectData() {
            // Given: A valid PENDING reservation with 5 tickets
            int ticketQuantity = 5;
            Instant futureExpiration = Instant.now().plus(15, ChronoUnit.MINUTES);
            Reservation validReservation = new Reservation(EVENT_ID, USER_ID, ticketQuantity, ReservationStatus.PENDING);
            setReservationId(validReservation, RESERVATION_ID);
            validReservation.setHoldExpiresAt(futureExpiration);
            setCreatedAndUpdatedAt(validReservation);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(validReservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When
            service.confirmReservation(request);

            // Then: Verify ticket details
            verify(ticketRepository).save(ticketCaptor.capture());
            Ticket createdTicket = ticketCaptor.getValue();

            assertThat(createdTicket.getReservationId()).isEqualTo(RESERVATION_ID);
            assertThat(createdTicket.getUserId()).isEqualTo(USER_ID);
            assertThat(createdTicket.getEventId()).isEqualTo(EVENT_ID);
            assertThat(createdTicket.getQuantity()).isEqualTo(ticketQuantity);
        }

        @Test
        @DisplayName("Should update reservation status to CONFIRMED when valid")
        void confirmReservation_WhenValid_ShouldUpdateStatusToConfirmed() {
            // Given
            Instant futureExpiration = Instant.now().plus(5, ChronoUnit.MINUTES);
            Reservation validReservation = createPendingReservation(futureExpiration);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(validReservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When
            ConfirmResponse response = service.confirmReservation(request);

            // Then
            assertThat(response.status()).isEqualTo("CONFIRMED");

            verify(reservationRepository).save(reservationCaptor.capture());
            assertThat(reservationCaptor.getValue().getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        }
    }

    // ========================================================================
    // Edge Cases and Additional Scenarios
    // ========================================================================

    @Nested
    @DisplayName("Edge Cases for Expiration Logic")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle null holdExpiresAt gracefully during confirmation")
        void confirmReservation_WhenHoldExpiresAtIsNull_ShouldTreatAsNotExpired() {
            // Given: A PENDING reservation with null holdExpiresAt (edge case)
            Reservation reservation = new Reservation(EVENT_ID, USER_ID, QUANTITY, ReservationStatus.PENDING);
            setReservationId(reservation, RESERVATION_ID);
            reservation.setHoldExpiresAt(null); // No expiration set
            setCreatedAndUpdatedAt(reservation);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When: According to isExpired() logic, null holdExpiresAt means not expired
            ConfirmResponse response = service.confirmReservation(request);

            // Then: Should succeed (isExpired returns false when holdExpiresAt is null)
            assertThat(response.status()).isEqualTo("CONFIRMED");
        }

        @Test
        @DisplayName("Should handle confirmation of already CONFIRMED reservation")
        void confirmReservation_WhenAlreadyConfirmed_ShouldThrowInvalidState() {
            // Given: A CONFIRMED reservation (not PENDING)
            Reservation confirmedReservation = new Reservation(EVENT_ID, USER_ID, QUANTITY, ReservationStatus.CONFIRMED);
            setReservationId(confirmedReservation, RESERVATION_ID);
            confirmedReservation.setHoldExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
            setCreatedAndUpdatedAt(confirmedReservation);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(confirmedReservation));

            ConfirmRequest request = new ConfirmRequest(RESERVATION_ID);

            // When & Then: Should throw InvalidReservationStateException
            assertThatThrownBy(() -> service.confirmReservation(request))
                .isInstanceOf(com.acme.tickets.exception.InvalidReservationStateException.class);

            // Verify no ticket was created
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("Should preserve reservation quantity when releasing expired reservation")
        void releaseReservation_WhenExpired_ShouldReleaseExactQuantity() {
            // Given: An expired reservation with specific quantity
            int specificQuantity = 7;
            Instant expiredTime = Instant.now().minus(5, ChronoUnit.MINUTES);
            Reservation expiredReservation = new Reservation(EVENT_ID, USER_ID, specificQuantity, ReservationStatus.PENDING);
            setReservationId(expiredReservation, RESERVATION_ID);
            expiredReservation.setHoldExpiresAt(expiredTime);
            setCreatedAndUpdatedAt(expiredReservation);

            // Inventory with 20 reserved
            Inventory inventory = new Inventory(EVENT_ID, TOTAL_TICKETS);
            inventory.setReserved(20);

            when(reservationRepository.findById(RESERVATION_ID))
                .thenReturn(Optional.of(expiredReservation));
            when(inventoryRepository.findById(EVENT_ID))
                .thenReturn(Optional.of(inventory));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
            when(inventoryRepository.save(any(Inventory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            ReleaseRequest request = new ReleaseRequest(RESERVATION_ID);

            // When
            service.releaseReservation(request);

            // Then: Inventory should be decremented by exactly 7
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getReserved()).isEqualTo(13); // 20 - 7 = 13
        }
    }
}
