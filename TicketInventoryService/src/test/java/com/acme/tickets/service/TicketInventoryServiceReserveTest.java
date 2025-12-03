package com.acme.tickets.service;

import com.acme.tickets.config.TicketInventoryProperties;
import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.ReserveRequest;
import com.acme.tickets.dto.ReserveResponse;
import com.acme.tickets.exception.InsufficientStockException;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour TicketInventoryService - Cas d'utilisation de réservation (INT-016).
 * Utilise JUnit 5 (Jupiter) et Mockito pour isoler la logique métier.
 * Aucun contexte Spring - test pur de la logique métier.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TicketInventoryService - Reservation Use Cases (INT-016)")
class TicketInventoryServiceReserveTest {

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

        // Default mock properties
        when(properties.getReservationHoldMinutes()).thenReturn(15);
        when(properties.getMaxTicketsPerReservation()).thenReturn(10);
        when(properties.getCategoryMaxPerReservation()).thenReturn(Map.of());
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
     * Helper to create a mock event response from EventCatalogClient.
     */
    private Map<String, Object> createEventResponse(int totalCapacity) {
        return Map.of(
                "id", 1L,
                "name", "Concert Test",
                "tickets", List.of(
                        Map.of("type", "VIP", "quantity", totalCapacity / 2),
                        Map.of("type", "STANDARD", "quantity", totalCapacity / 2)
                )
        );
    }

    // ========================================================================
    // Test Case 1: Reserve tickets successfully when inventory exists and stock is sufficient
    // ========================================================================
    @Nested
    @DisplayName("TC1: Reserve tickets successfully with existing inventory and sufficient stock")
    class ReserveSuccessfullyTests {

        @Test
        @DisplayName("GIVEN eventId=1, quantity=2, inventory(total=200, reserved=10) WHEN reserveTickets THEN reservation PENDING with quantity=2 and reserved updated to 12")
        void shouldReserveTicketsSuccessfully_WhenInventoryExistsAndStockSufficient() {
            // GIVEN
            Long eventId = 1L;
            Long userId = 42L;
            int requestedQuantity = 2;
            
            // Existing inventory: total=200, reserved=10 -> available=190
            Inventory existingInventory = new Inventory(eventId, 200);
            existingInventory.setReserved(10);
            
            ReserveRequest request = new ReserveRequest(eventId, userId, requestedQuantity);
            
            // Mock EventCatalogClient for category limit check
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of(
                    "id", eventId,
                    "category", Map.of("categoryType", "MUSIC")
            ));
            
            when(inventoryRepository.findByIdWithLock(eventId))
                    .thenReturn(Optional.of(existingInventory));
            
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> {
                        Reservation r = invocation.getArgument(0);
                        setReservationId(r, 123L);
                        return r;
                    });
            
            when(inventoryRepository.save(any(Inventory.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // WHEN
            ReserveResponse response = service.reserveTickets(request, null);

            // THEN
            // Verify response
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(123L);
            assertThat(response.status()).isEqualTo(ReservationStatus.PENDING.name());
            assertThat(response.quantity()).isEqualTo(requestedQuantity);
            assertThat(response.holdExpiresAt()).isNotNull();
            assertThat(response.holdExpiresAt()).isAfter(Instant.now());
            
            // Verify reservation was saved with correct data
            verify(reservationRepository).save(reservationCaptor.capture());
            Reservation savedReservation = reservationCaptor.getValue();
            assertThat(savedReservation.getEventId()).isEqualTo(eventId);
            assertThat(savedReservation.getUserId()).isEqualTo(userId);
            assertThat(savedReservation.getQuantity()).isEqualTo(requestedQuantity);
            assertThat(savedReservation.getStatus()).isEqualTo(ReservationStatus.PENDING);
            
            // Verify inventory was updated: reserved should be 10 + 2 = 12
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();
            assertThat(savedInventory.getReserved()).isEqualTo(12);
        }

        @Test
        @DisplayName("GIVEN sufficient stock WHEN reserveTickets THEN inventory reserved count is incremented by quantity")
        void shouldIncrementReservedCount_WhenReservingTickets() {
            // GIVEN
            Long eventId = 5L;
            int initialReserved = 50;
            int quantityToReserve = 5;
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(initialReserved);
            
            ReserveRequest request = new ReserveRequest(eventId, 100L, quantityToReserve);
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 999L);
                return r;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            service.reserveTickets(request, null);

            // THEN
            verify(inventoryRepository).save(inventoryCaptor.capture());
            assertThat(inventoryCaptor.getValue().getReserved())
                    .isEqualTo(initialReserved + quantityToReserve);
        }
    }

    // ========================================================================
    // Test Case 2: Lazy inventory initialization when inventory does not exist
    // ========================================================================
    @Nested
    @DisplayName("TC2: Lazy inventory initialization when inventory does not exist")
    class LazyInventoryInitializationTests {

        @Test
        @DisplayName("GIVEN inventory not found WHEN reserveTickets THEN initialize inventory from EventCatalog and reserve")
        void shouldInitializeInventoryLazily_WhenInventoryDoesNotExist() {
            // GIVEN
            Long eventId = 99L;
            Long userId = 42L;
            int requestedQuantity = 3;
            int eventTotalCapacity = 200; // 100 VIP + 100 STANDARD
            
            ReserveRequest request = new ReserveRequest(eventId, userId, requestedQuantity);
            
            // Inventory does not exist
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.empty());
            
            // EventCatalogClient returns event with total capacity of 200
            when(eventCatalogClient.getEventById(eventId)).thenReturn(
                    createEventResponse(eventTotalCapacity)
            );
            
            // When saving new inventory, return it
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                return inv;
            });
            
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
                Reservation r = invocation.getArgument(0);
                setReservationId(r, 456L);
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, null);

            // THEN
            // Verify response
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(456L);
            assertThat(response.status()).isEqualTo(ReservationStatus.PENDING.name());
            assertThat(response.quantity()).isEqualTo(requestedQuantity);
            
            // Verify inventory was created with correct total from event
            verify(inventoryRepository, atLeastOnce()).save(inventoryCaptor.capture());
            List<Inventory> savedInventories = inventoryCaptor.getAllValues();
            
            // First save should be the newly created inventory
            Inventory createdInventory = savedInventories.get(0);
            assertThat(createdInventory.getEventId()).isEqualTo(eventId);
            assertThat(createdInventory.getTotal()).isEqualTo(eventTotalCapacity);
            
            // Verify EventCatalogClient was called
            verify(eventCatalogClient, atLeastOnce()).getEventById(eventId);
        }

        @Test
        @DisplayName("GIVEN inventory not found WHEN EventCatalog returns event with ticketTypes THEN calculate total from ticketTypes quantities")
        void shouldCalculateTotalFromTicketTypes_WhenInitializingInventory() {
            // GIVEN
            Long eventId = 77L;
            int vipQuantity = 50;
            int standardQuantity = 150;
            int expectedTotal = vipQuantity + standardQuantity; // 200
            int requestedQuantity = 1;
            
            ReserveRequest request = new ReserveRequest(eventId, 1L, requestedQuantity);
            
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.empty());
            
            // EventCatalog returns event with specific ticket types
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of(
                    "id", eventId,
                    "tickets", List.of(
                            Map.of("type", "VIP", "quantity", vipQuantity),
                            Map.of("type", "STANDARD", "quantity", standardQuantity)
                    )
            ));
            
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 1L);
                return r;
            });

            // WHEN
            service.reserveTickets(request, null);

            // THEN
            // Verify inventory was saved (first for creation, then for reservation update)
            verify(inventoryRepository, atLeastOnce()).save(inventoryCaptor.capture());
            List<Inventory> savedInventories = inventoryCaptor.getAllValues();
            
            // First save: created inventory with total from ticketTypes
            Inventory createdInventory = savedInventories.get(0);
            assertThat(createdInventory.getTotal()).isEqualTo(expectedTotal);
            
            // After all operations, reserved should reflect the requested quantity
            Inventory finalInventory = savedInventories.get(savedInventories.size() - 1);
            assertThat(finalInventory.getReserved()).isEqualTo(requestedQuantity);
        }
    }

    // ========================================================================
    // Test Case 3: Idempotency - duplicate calls with same idempotencyKey
    // ========================================================================
    @Nested
    @DisplayName("TC3: Idempotency - duplicate calls with same idempotencyKey")
    class IdempotencyTests {

        @Test
        @DisplayName("GIVEN first call with idempotencyKey WHEN reserveTickets THEN create new PENDING reservation")
        void shouldCreateReservation_OnFirstCallWithIdempotencyKey() {
            // GIVEN
            Long eventId = 1L;
            Long userId = 42L;
            int quantity = 2;
            String idempotencyKey = "unique-key-123";
            
            ReserveRequest request = new ReserveRequest(eventId, userId, quantity);
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(10);
            
            // No existing reservation with this idempotencyKey
            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                    .thenReturn(Optional.empty());
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 100L);
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, idempotencyKey);

            // THEN
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(100L);
            assertThat(response.status()).isEqualTo(ReservationStatus.PENDING.name());
            
            // Verify reservation was saved with idempotencyKey
            verify(reservationRepository).save(reservationCaptor.capture());
            assertThat(reservationCaptor.getValue().getIdempotencyKey()).isEqualTo(idempotencyKey);
            
            // Verify inventory was updated
            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("GIVEN second call with same idempotencyKey and active reservation WHEN reserveTickets THEN return existing reservation without modifying inventory")
        void shouldReturnExistingReservation_OnSecondCallWithSameIdempotencyKey() {
            // GIVEN
            Long eventId = 1L;
            Long userId = 42L;
            int quantity = 2;
            String idempotencyKey = "unique-key-123";
            Long existingReservationId = 100L;
            
            ReserveRequest request = new ReserveRequest(eventId, userId, quantity);
            
            // Existing active PENDING reservation with this idempotencyKey
            Reservation existingReservation = new Reservation(eventId, userId, quantity, ReservationStatus.PENDING);
            setReservationId(existingReservation, existingReservationId);
            existingReservation.setIdempotencyKey(idempotencyKey);
            existingReservation.setHoldExpiresAt(Instant.now().plusSeconds(900)); // Still valid
            
            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                    .thenReturn(Optional.of(existingReservation));

            // WHEN
            ReserveResponse response = service.reserveTickets(request, idempotencyKey);

            // THEN
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(existingReservationId);
            assertThat(response.status()).isEqualTo(ReservationStatus.PENDING.name());
            assertThat(response.quantity()).isEqualTo(quantity);
            
            // Verify no new reservation was created
            verify(reservationRepository, never()).save(any(Reservation.class));
            
            // Verify inventory was NOT modified
            verify(inventoryRepository, never()).save(any(Inventory.class));
            verify(inventoryRepository, never()).findByIdWithLock(any());
        }

        @Test
        @DisplayName("GIVEN second call with same idempotencyKey and CONFIRMED reservation WHEN reserveTickets THEN return existing confirmed reservation")
        void shouldReturnExistingConfirmedReservation_OnSecondCallWithSameIdempotencyKey() {
            // GIVEN
            String idempotencyKey = "confirmed-key-456";
            Long existingReservationId = 200L;
            
            ReserveRequest request = new ReserveRequest(1L, 42L, 2);
            
            // Existing CONFIRMED reservation (still considered active)
            Reservation existingReservation = new Reservation(1L, 42L, 2, ReservationStatus.CONFIRMED);
            setReservationId(existingReservation, existingReservationId);
            existingReservation.setIdempotencyKey(idempotencyKey);
            existingReservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
            
            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                    .thenReturn(Optional.of(existingReservation));

            // WHEN
            ReserveResponse response = service.reserveTickets(request, idempotencyKey);

            // THEN
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(existingReservationId);
            assertThat(response.status()).isEqualTo(ReservationStatus.CONFIRMED.name());
            
            // No new reservation or inventory modification
            verify(reservationRepository, never()).save(any(Reservation.class));
            verify(inventoryRepository, never()).save(any(Inventory.class));
        }

        @Test
        @DisplayName("GIVEN call with same idempotencyKey but CANCELED reservation WHEN reserveTickets THEN create new reservation")
        void shouldCreateNewReservation_WhenExistingReservationIsCanceled() {
            // GIVEN
            Long eventId = 1L;
            Long userId = 42L;
            int quantity = 2;
            String idempotencyKey = "canceled-key-789";
            
            ReserveRequest request = new ReserveRequest(eventId, userId, quantity);
            
            // Existing CANCELED reservation (not active)
            Reservation canceledReservation = new Reservation(eventId, userId, quantity, ReservationStatus.CANCELED);
            setReservationId(canceledReservation, 300L);
            canceledReservation.setIdempotencyKey(idempotencyKey);
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(10);
            
            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                    .thenReturn(Optional.of(canceledReservation));
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 400L); // New reservation ID
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, idempotencyKey);

            // THEN
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(400L); // New reservation
            assertThat(response.status()).isEqualTo(ReservationStatus.PENDING.name());
            
            // Verify new reservation was created
            verify(reservationRepository).save(any(Reservation.class));
            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("GIVEN call with same idempotencyKey but EXPIRED reservation WHEN reserveTickets THEN create new reservation")
        void shouldCreateNewReservation_WhenExistingReservationIsExpired() {
            // GIVEN
            Long eventId = 1L;
            Long userId = 42L;
            int quantity = 2;
            String idempotencyKey = "expired-key-101";
            
            ReserveRequest request = new ReserveRequest(eventId, userId, quantity);
            
            // Existing EXPIRED reservation (not active)
            Reservation expiredReservation = new Reservation(eventId, userId, quantity, ReservationStatus.EXPIRED);
            setReservationId(expiredReservation, 500L);
            expiredReservation.setIdempotencyKey(idempotencyKey);
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(10);
            
            when(reservationRepository.findByIdempotencyKey(idempotencyKey))
                    .thenReturn(Optional.of(expiredReservation));
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 600L);
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, idempotencyKey);

            // THEN
            assertThat(response.reservationId()).isEqualTo(600L);
            assertThat(response.status()).isEqualTo(ReservationStatus.PENDING.name());
            
            verify(reservationRepository).save(any(Reservation.class));
        }

        @Test
        @DisplayName("GIVEN null idempotencyKey WHEN reserveTickets THEN skip idempotency check and create reservation")
        void shouldSkipIdempotencyCheck_WhenIdempotencyKeyIsNull() {
            // GIVEN
            Long eventId = 1L;
            ReserveRequest request = new ReserveRequest(eventId, 42L, 2);
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(10);
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 700L);
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, null);

            // THEN
            assertThat(response.reservationId()).isEqualTo(700L);
            
            // Verify idempotency check was NOT performed
            verify(reservationRepository, never()).findByIdempotencyKey(any());
            
            // Verify reservation was created with null idempotencyKey
            verify(reservationRepository).save(reservationCaptor.capture());
            assertThat(reservationCaptor.getValue().getIdempotencyKey()).isNull();
        }
    }

    // ========================================================================
    // Additional edge cases for reservation flow
    // ========================================================================
    @Nested
    @DisplayName("Edge Cases: Insufficient stock and validation")
    class EdgeCasesTests {

        @Test
        @DisplayName("GIVEN insufficient stock WHEN reserveTickets THEN throw InsufficientStockException")
        void shouldThrowInsufficientStockException_WhenStockInsufficient() {
            // GIVEN
            Long eventId = 1L;
            int requestedQuantity = 10; // Within category limit but exceeds available
            
            // Inventory: total=200, reserved=195 -> available=5, requesting 10
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(195);
            
            ReserveRequest request = new ReserveRequest(eventId, 42L, requestedQuantity);
            
            // Mock properties to allow 10 tickets (no category limit adjustment)
            when(properties.getMaxTicketsPerReservation()).thenReturn(10);
            when(properties.getCategoryMaxPerReservation()).thenReturn(Map.of());
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));

            // WHEN / THEN
            assertThatThrownBy(() -> service.reserveTickets(request, null))
                    .isInstanceOf(InsufficientStockException.class);
            
            // Verify no reservation was saved
            verify(reservationRepository, never()).save(any(Reservation.class));
            // Verify inventory was not modified
            verify(inventoryRepository, never()).save(any(Inventory.class));
        }

        @Test
        @DisplayName("GIVEN quantity exceeds available (edge case: exactly at limit) WHEN reserveTickets THEN throw InsufficientStockException")
        void shouldThrowException_WhenQuantityExactlyExceedsAvailable() {
            // GIVEN
            Long eventId = 1L;
            // total=200, reserved=195 -> available=5, requesting 6
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(195);
            
            ReserveRequest request = new ReserveRequest(eventId, 42L, 6);
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));

            // WHEN / THEN
            assertThatThrownBy(() -> service.reserveTickets(request, null))
                    .isInstanceOf(InsufficientStockException.class);
        }

        @Test
        @DisplayName("GIVEN quantity equals available stock WHEN reserveTickets THEN succeed")
        void shouldSucceed_WhenQuantityEqualsAvailableStock() {
            // GIVEN
            Long eventId = 1L;
            // total=200, reserved=195 -> available=5, requesting 5
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(195);
            
            ReserveRequest request = new ReserveRequest(eventId, 42L, 5);
            
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of());
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 888L);
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, null);

            // THEN
            assertThat(response).isNotNull();
            assertThat(response.reservationId()).isEqualTo(888L);
            
            // Verify inventory is now fully reserved
            verify(inventoryRepository).save(inventoryCaptor.capture());
            assertThat(inventoryCaptor.getValue().getReserved()).isEqualTo(200);
            assertThat(inventoryCaptor.getValue().getAvailable()).isEqualTo(0);
        }

        @Test
        @DisplayName("GIVEN category limit lower than requested WHEN reserveTickets THEN quantity adjusted to category limit")
        void shouldAdjustQuantity_WhenCategoryLimitApplies() {
            // GIVEN
            Long eventId = 1L;
            int requestedQuantity = 8;
            int categoryLimit = 4; // SPORTS category limit
            
            Inventory inventory = new Inventory(eventId, 200);
            inventory.setReserved(10);
            
            ReserveRequest request = new ReserveRequest(eventId, 42L, requestedQuantity);
            
            when(properties.getCategoryMaxPerReservation()).thenReturn(Map.of("SPORTS", categoryLimit));
            when(eventCatalogClient.getEventById(eventId)).thenReturn(Map.of(
                    "category", Map.of("categoryType", "SPORTS")
            ));
            when(inventoryRepository.findByIdWithLock(eventId)).thenReturn(Optional.of(inventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                setReservationId(r, 999L);
                return r;
            });

            // WHEN
            ReserveResponse response = service.reserveTickets(request, null);

            // THEN
            assertThat(response.quantity()).isEqualTo(categoryLimit); // Adjusted to 4
            
            verify(reservationRepository).save(reservationCaptor.capture());
            assertThat(reservationCaptor.getValue().getQuantity()).isEqualTo(categoryLimit);
            
            // Inventory should be incremented by 4, not 8
            verify(inventoryRepository).save(inventoryCaptor.capture());
            assertThat(inventoryCaptor.getValue().getReserved()).isEqualTo(14); // 10 + 4
        }
    }
}
