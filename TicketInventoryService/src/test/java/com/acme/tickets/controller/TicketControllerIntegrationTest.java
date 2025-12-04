package com.acme.tickets.controller;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Ticket;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.integration.EventCatalogClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for TicketController REST endpoints.
 * Uses H2 in-memory database and mocks external EventCatalogClient.
 * Tests the full happy-path flow: reserve -> confirm -> check availability -> get user reservations.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@DisplayName("TicketController Integration Tests")
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TicketRepository ticketRepository;

    /**
     * Mock the EventCatalogClient to avoid external HTTP calls.
     * This bean replaces the real EventCatalogClient in the Spring context.
     */
    @MockBean
    private EventCatalogClient eventCatalogClient;

    // Test data constants
    private static final Long EVENT_ID = 1L;
    private static final Long USER_ID = 42L;
    private static final int INITIAL_TOTAL_TICKETS = 100;
    private static final int RESERVATION_QUANTITY = 3;

    @BeforeEach
    void setUp() {
        // Setup mock for EventCatalogClient - return empty map (no category limits)
        when(eventCatalogClient.getEventById(anyLong())).thenReturn(Map.of(
            "id", EVENT_ID,
            "name", "Test Concert",
            "category", "MUSIC"
        ));
    }

    // ========================================================================
    // Happy Path Integration Flow Tests
    // ========================================================================

    @Nested
    @DisplayName("Happy Path - Full Reservation Flow")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class HappyPathFlowTests {

        private Long reservationId;

        @Test
        @Order(1)
        @DisplayName("POST /tickets/reserve - Should create PENDING reservation and Inventory")
        void reserve_ShouldCreatePendingReservationAndInventory() throws Exception {
            // Given: Create inventory for the event
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            String requestBody = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, RESERVATION_QUANTITY);

            // When & Then
            MvcResult result = mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reservationId").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.holdExpiresAt").isNotEmpty())
                .andExpect(jsonPath("$.quantity").value(RESERVATION_QUANTITY))
                .andReturn();

            // Verify reservation was persisted
            String responseBody = result.getResponse().getContentAsString();
            Map<String, Object> response = objectMapper.readValue(responseBody, Map.class);
            Long createdReservationId = ((Number) response.get("reservationId")).longValue();

            assertThat(reservationRepository.findById(createdReservationId)).isPresent();

            // Verify inventory reserved count was updated
            Inventory updatedInventory = inventoryRepository.findById(EVENT_ID).orElseThrow();
            assertThat(updatedInventory.getReserved()).isEqualTo(RESERVATION_QUANTITY);
            assertThat(updatedInventory.getAvailable()).isEqualTo(INITIAL_TOTAL_TICKETS - RESERVATION_QUANTITY);
        }

        @Test
        @Order(2)
        @DisplayName("POST /tickets/confirm - Should confirm reservation and create Tickets")
        void confirm_ShouldConfirmReservationAndCreateTickets() throws Exception {
            // Given: Create inventory and a PENDING reservation
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            // First, create a reservation via the reserve endpoint
            String reserveRequest = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, RESERVATION_QUANTITY);

            MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(reserveRequest))
                .andExpect(status().isOk())
                .andReturn();

            String reserveResponse = reserveResult.getResponse().getContentAsString();
            Map<String, Object> reserveResponseMap = objectMapper.readValue(reserveResponse, Map.class);
            Long reservationId = ((Number) reserveResponseMap.get("reservationId")).longValue();

            // When: Confirm the reservation
            String confirmRequest = """
                {
                    "reservationId": %d
                }
                """.formatted(reservationId);

            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(confirmRequest))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

            // Then: Verify Ticket rows were created in the database
            List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);
            assertThat(tickets).isNotEmpty();
            assertThat(tickets.get(0).getUserId()).isEqualTo(USER_ID);
            assertThat(tickets.get(0).getEventId()).isEqualTo(EVENT_ID);
            assertThat(tickets.get(0).getQuantity()).isEqualTo(RESERVATION_QUANTITY);
        }

        @Test
        @Order(3)
        @DisplayName("GET /tickets/availability/{eventId} - Should return correct availability after reservation")
        void getAvailability_ShouldReturnCorrectAvailabilityAfterReservation() throws Exception {
            // Given: Create inventory and make a reservation
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            // Make a reservation
            String reserveRequest = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, RESERVATION_QUANTITY);

            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(reserveRequest))
                .andExpect(status().isOk());

            // When & Then: Check availability
            mockMvc.perform(get("/tickets/availability/{eventId}", EVENT_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventId").value(EVENT_ID))
                .andExpect(jsonPath("$.total").value(INITIAL_TOTAL_TICKETS))
                .andExpect(jsonPath("$.available").value(INITIAL_TOTAL_TICKETS - RESERVATION_QUANTITY));
        }

        @Test
        @Order(4)
        @DisplayName("GET /tickets/user/{userId} - Should return user reservations including confirmed reservation")
        void getUserReservations_ShouldReturnUserReservationsIncludingConfirmed() throws Exception {
            // Given: Create inventory, make and confirm a reservation
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            // Reserve
            String reserveRequest = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, RESERVATION_QUANTITY);

            MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(reserveRequest))
                .andExpect(status().isOk())
                .andReturn();

            String reserveResponse = reserveResult.getResponse().getContentAsString();
            Map<String, Object> reserveResponseMap = objectMapper.readValue(reserveResponse, Map.class);
            Long reservationId = ((Number) reserveResponseMap.get("reservationId")).longValue();

            // Confirm
            String confirmRequest = """
                {
                    "reservationId": %d
                }
                """.formatted(reservationId);

            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(confirmRequest))
                .andExpect(status().isOk());

            // When & Then: Get user reservations
            mockMvc.perform(get("/tickets/user/{userId}", USER_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.items[?(@.reservationId == %d)]", reservationId).exists())
                .andExpect(jsonPath("$.items[?(@.status == 'CONFIRMED')]").exists())
                .andExpect(jsonPath("$.items[0].eventId").value(EVENT_ID))
                .andExpect(jsonPath("$.items[0].quantity").value(RESERVATION_QUANTITY));
        }
    }

    // ========================================================================
    // Complete Integration Flow Test (All Steps in One Test)
    // ========================================================================

    @Test
    @DisplayName("Complete flow: reserve -> confirm -> check availability -> get user reservations")
    void completeReservationFlow_ShouldWorkEndToEnd() throws Exception {
        // Step 0: Setup inventory
        Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
        inventoryRepository.save(inventory);

        // Step 1: Reserve tickets
        String reserveRequest = """
            {
                "eventId": %d,
                "userId": %d,
                "quantity": %d
            }
            """.formatted(EVENT_ID, USER_ID, RESERVATION_QUANTITY);

        MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reserveRequest))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.holdExpiresAt").isNotEmpty())
            .andReturn();

        Map<String, Object> reserveResponse = objectMapper.readValue(
            reserveResult.getResponse().getContentAsString(), Map.class);
        Long reservationId = ((Number) reserveResponse.get("reservationId")).longValue();

        // Step 2: Confirm reservation
        String confirmRequest = """
            {
                "reservationId": %d
            }
            """.formatted(reservationId);

        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(confirmRequest))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Step 3: Verify tickets were created
        List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);
        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).getQuantity()).isEqualTo(RESERVATION_QUANTITY);

        // Step 4: Check availability (available = total - reserved)
        mockMvc.perform(get("/tickets/availability/{eventId}", EVENT_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(INITIAL_TOTAL_TICKETS))
            .andExpect(jsonPath("$.available").value(INITIAL_TOTAL_TICKETS - RESERVATION_QUANTITY));

        // Step 5: Get user reservations
        mockMvc.perform(get("/tickets/user/{userId}", USER_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].status").value("CONFIRMED"))
            .andExpect(jsonPath("$.items[0].quantity").value(RESERVATION_QUANTITY));
    }

    // ========================================================================
    // Failure Scenario Tests
    // ========================================================================

    @Nested
    @DisplayName("Failure Scenarios")
    class FailureScenarioTests {

        @Test
        @DisplayName("POST /tickets/reserve - Should return 400 when quantity exceeds max-tickets-per-reservation")
        void reserve_ShouldReturn400_WhenQuantityExceedsMaxTicketsPerReservation() throws Exception {
            // Given: Create inventory for the event
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            // The max-tickets-per-reservation is configured to 10 in application-test.properties
            // Request quantity of 11 (exceeds the max of 10 defined in ReserveRequest @Max annotation)
            int exceedingQuantity = 11;

            String requestBody = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, exceedingQuantity);

            // When & Then: Expect 400 Bad Request due to validation
            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.errors.quantity").exists());
        }

        @Test
        @DisplayName("POST /tickets/reserve - Should return 400 when quantity is zero or negative")
        void reserve_ShouldReturn400_WhenQuantityIsZeroOrNegative() throws Exception {
            // Given: Create inventory
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            String requestBody = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": 0
                }
                """.formatted(EVENT_ID, USER_ID);

            // When & Then
            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"));
        }

        @Test
        @DisplayName("POST /tickets/reserve - Should return 400 when eventId is missing")
        void reserve_ShouldReturn400_WhenEventIdIsMissing() throws Exception {
            String requestBody = """
                {
                    "userId": %d,
                    "quantity": 2
                }
                """.formatted(USER_ID);

            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.eventId").exists());
        }

        @Test
        @DisplayName("POST /tickets/confirm - Should return 404 when reservation does not exist")
        void confirm_ShouldReturn404_WhenReservationDoesNotExist() throws Exception {
            String confirmRequest = """
                {
                    "reservationId": 99999
                }
                """;

            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(confirmRequest))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Reservation Not Found"));
        }

        @Test
        @DisplayName("GET /tickets/availability/{eventId} - Should lazy initialize inventory when not found")
        void getAvailability_ShouldLazyInitializeInventory_WhenInventoryDoesNotExist() throws Exception {
            // Given: No inventory exists, but EventCatalogClient returns event with no tickets
            Long nonExistentEventId = 99999L;
            when(eventCatalogClient.getEventById(nonExistentEventId)).thenReturn(Map.of(
                "id", nonExistentEventId,
                "name", "Test Event",
                "category", "MUSIC",
                "tickets", List.of() // No ticket types
            ));

            // When & Then: Should return 200 with lazy-initialized inventory (0 tickets)
            mockMvc.perform(get("/tickets/availability/{eventId}", nonExistentEventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventId").value(nonExistentEventId))
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.available").value(0));
        }

        @Test
        @DisplayName("POST /tickets/reserve - Should return 409 when insufficient stock")
        void reserve_ShouldReturn409_WhenInsufficientStock() throws Exception {
            // Given: Create inventory with only 2 tickets
            Inventory inventory = new Inventory(EVENT_ID, 2);
            inventoryRepository.save(inventory);

            // Try to reserve 5 tickets
            String requestBody = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": 5
                }
                """.formatted(EVENT_ID, USER_ID);

            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Insufficient Stock"));
        }
    }

    // ========================================================================
    // Idempotency Tests
    // ========================================================================

    @Nested
    @DisplayName("Idempotency Tests")
    class IdempotencyTests {

        @Test
        @DisplayName("POST /tickets/reserve with Idempotency-Key - Should return same reservation for duplicate requests")
        void reserve_WithIdempotencyKey_ShouldReturnSameReservation() throws Exception {
            // Given
            Inventory inventory = new Inventory(EVENT_ID, INITIAL_TOTAL_TICKETS);
            inventoryRepository.save(inventory);

            String idempotencyKey = "unique-key-12345";
            String requestBody = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, RESERVATION_QUANTITY);

            // First request
            MvcResult firstResult = mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Idempotency-Key", idempotencyKey)
                    .content(requestBody))
                .andExpect(status().isOk())
                .andReturn();

            Map<String, Object> firstResponse = objectMapper.readValue(
                firstResult.getResponse().getContentAsString(), Map.class);
            Long firstReservationId = ((Number) firstResponse.get("reservationId")).longValue();

            // Second request with same idempotency key
            MvcResult secondResult = mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Idempotency-Key", idempotencyKey)
                    .content(requestBody))
                .andExpect(status().isOk())
                .andReturn();

            Map<String, Object> secondResponse = objectMapper.readValue(
                secondResult.getResponse().getContentAsString(), Map.class);
            Long secondReservationId = ((Number) secondResponse.get("reservationId")).longValue();

            // Then: Both requests should return the same reservation ID
            assertThat(secondReservationId).isEqualTo(firstReservationId);

            // And: Only one reservation should exist in the database
            assertThat(reservationRepository.count()).isEqualTo(1);
        }
    }

    // ========================================================================
    // Edge Case Tests
    // ========================================================================

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("GET /tickets/user/{userId} - Should return empty list for user with no reservations")
        void getUserReservations_ShouldReturnEmptyList_ForUserWithNoReservations() throws Exception {
            Long userWithNoReservations = 99999L;

            mockMvc.perform(get("/tickets/user/{userId}", userWithNoReservations))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items").isEmpty());
        }

        @Test
        @DisplayName("POST /tickets/reserve - Should reserve exactly available amount")
        void reserve_ShouldReserveExactlyAvailableAmount() throws Exception {
            // Given: Inventory with exactly 5 tickets
            int exactAmount = 5;
            Inventory inventory = new Inventory(EVENT_ID, exactAmount);
            inventoryRepository.save(inventory);

            String requestBody = """
                {
                    "eventId": %d,
                    "userId": %d,
                    "quantity": %d
                }
                """.formatted(EVENT_ID, USER_ID, exactAmount);

            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(exactAmount));

            // Verify availability is now 0
            mockMvc.perform(get("/tickets/availability/{eventId}", EVENT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(0));
        }
    }
}
