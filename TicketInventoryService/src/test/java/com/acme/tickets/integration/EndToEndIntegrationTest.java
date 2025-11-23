package com.acme.tickets.integration;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration de bout en bout pour les scénarios complets
 * de réservation et gestion de tickets.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("End-to-End Integration Tests")
class EndToEndIntegrationTest {

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

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        reservationRepository.deleteAll();
        inventoryRepository.deleteAll();
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: Successful ticket purchase flow")
    void shouldCompleteFullTicketPurchaseFlow() throws Exception {
        // GIVEN: Event with available tickets
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        // STEP 1: Check availability
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(100));

        // STEP 2: Reserve tickets
        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 5);
        MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andReturn();

        ReserveResponse reserveResponse = objectMapper.readValue(
            reserveResult.getResponse().getContentAsString(),
            ReserveResponse.class
        );
        Long reservationId = reserveResponse.reservationId();

        // STEP 3: Verify availability decreased
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(95));

        // STEP 4: Confirm reservation
        ConfirmRequest confirmRequest = new ConfirmRequest(reservationId);
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // STEP 5: Verify user reservations
        mockMvc.perform(get("/tickets/user/42"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].status").value("CONFIRMED"))
            .andExpect(jsonPath("$.items[0].quantity").value(5));

        // STEP 6: Verify tickets created
        assertThat(ticketRepository.findAll()).hasSize(1);
        assertThat(reservationRepository.findById(reservationId))
            .isPresent()
            .get()
            .satisfies(r -> assertThat(r.getStatus()).isEqualTo(ReservationStatus.CONFIRMED));
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: User cancels reservation before confirmation")
    void shouldAllowUserToCancelReservation() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 50);
        inventoryRepository.save(inventory);

        // STEP 1: Reserve tickets
        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 10);
        MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andExpect(status().isOk())
            .andReturn();

        ReserveResponse reserveResponse = objectMapper.readValue(
            reserveResult.getResponse().getContentAsString(),
            ReserveResponse.class
        );

        // STEP 2: Verify stock decreased
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(40));

        // STEP 3: Cancel reservation
        ReleaseRequest releaseRequest = new ReleaseRequest(reserveResponse.reservationId());
        mockMvc.perform(post("/tickets/release")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(releaseRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELED"));

        // STEP 4: Verify stock restored
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(50));

        // STEP 5: Verify reservation canceled
        assertThat(reservationRepository.findById(reserveResponse.reservationId()))
            .isPresent()
            .get()
            .satisfies(r -> assertThat(r.getStatus()).isEqualTo(ReservationStatus.CANCELED));
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: Multiple users reserve tickets concurrently")
    void shouldHandleMultipleConcurrentReservations() throws Exception {
        // GIVEN: Limited tickets
        Inventory inventory = new Inventory(1L, 20);
        inventoryRepository.save(inventory);

        // STEP 1: User 1 reserves 12 tickets (valid: 1-10 max per request, so we'll use 10)
        ReserveRequest user1Request = new ReserveRequest(1L, 101L, 10);
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user1Request)))
            .andExpect(status().isOk());

        // STEP 2: User 2 reserves 8 tickets (should succeed)
        ReserveRequest user2Request = new ReserveRequest(1L, 102L, 8);
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user2Request)))
            .andExpect(status().isOk());

        // STEP 3: User 3 tries to reserve 3 more (should fail - only 2 left)
        ReserveRequest user3Request = new ReserveRequest(1L, 103L, 3);
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user3Request)))
            .andExpect(status().isConflict());

        // STEP 4: Verify exact stock count
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(2))
            .andExpect(jsonPath("$.total").value(20));
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: User reserves with idempotency key multiple times")
    void shouldPreventDuplicateReservationsWithIdempotency() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest request = new ReserveRequest(1L, 42L, 10);  // Changed from 15 to 10 (max allowed)
        String idempotencyKey = "user-42-event-1-attempt-1";

        // STEP 1: First reservation
        MvcResult result1 = mockMvc.perform(post("/tickets/reserve")
                .header("Idempotency-Key", idempotencyKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn();

        // STEP 2: Retry with same key (network issue simulation)
        MvcResult result2 = mockMvc.perform(post("/tickets/reserve")
                .header("Idempotency-Key", idempotencyKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn();

        // STEP 3: Verify same reservation returned
        ReserveResponse response1 = objectMapper.readValue(
            result1.getResponse().getContentAsString(), ReserveResponse.class);
        ReserveResponse response2 = objectMapper.readValue(
            result2.getResponse().getContentAsString(), ReserveResponse.class);
        
        assertThat(response1.reservationId()).isEqualTo(response2.reservationId());

        // STEP 4: Verify only 10 tickets reserved (not 20)
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(90));

        assertThat(reservationRepository.findAll()).hasSize(1);
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: Cannot confirm expired reservation")
    void shouldRejectConfirmationOfExpiredReservation() throws Exception {
        // GIVEN: Manually create expired reservation
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.PENDING);
        reservation.setHoldExpiresAt(Instant.now().minusSeconds(60)); // Expired 1 minute ago
        reservation = reservationRepository.save(reservation);

        // STEP 1: Try to confirm expired reservation
        ConfirmRequest confirmRequest = new ConfirmRequest(reservation.getId());
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("expiré")));

        // STEP 2: Verify reservation still pending (not confirmed)
        assertThat(reservationRepository.findById(reservation.getId()))
            .isPresent()
            .get()
            .satisfies(r -> assertThat(r.getStatus()).isEqualTo(ReservationStatus.PENDING));
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: User has multiple reservations for different events")
    void shouldTrackMultipleReservationsPerUser() throws Exception {
        // GIVEN: Multiple events
        Inventory inventory1 = new Inventory(1L, 100);
        Inventory inventory2 = new Inventory(2L, 50);
        inventoryRepository.save(inventory1);
        inventoryRepository.save(inventory2);

        Long userId = 42L;

        // STEP 1: Reserve for event 1
        ReserveRequest request1 = new ReserveRequest(1L, userId, 5);
        MvcResult result1 = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request1)))
            .andExpect(status().isOk())
            .andReturn();
        
        ReserveResponse response1 = objectMapper.readValue(
            result1.getResponse().getContentAsString(), ReserveResponse.class);

        // STEP 2: Reserve for event 2
        ReserveRequest request2 = new ReserveRequest(2L, userId, 3);
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request2)))
            .andExpect(status().isOk());

        // STEP 3: Confirm first reservation
        ConfirmRequest confirmRequest = new ConfirmRequest(response1.reservationId());
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
            .andExpect(status().isOk());

        // STEP 4: Get all user reservations
        mockMvc.perform(get("/tickets/user/" + userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items.length()").value(2))
            .andExpect(jsonPath("$.items[?(@.eventId == 1)].status").value(org.hamcrest.Matchers.contains("CONFIRMED")))
            .andExpect(jsonPath("$.items[?(@.eventId == 2)].status").value(org.hamcrest.Matchers.contains("PENDING")));
    }

    @Test
    @WithMockUser
    @DisplayName("Scenario: Release after confirmation (refund scenario)")
    void shouldAllowReleaseOfConfirmedReservation() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        // STEP 1: Reserve and confirm
        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 10);
        MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andExpect(status().isOk())
            .andReturn();

        ReserveResponse reserveResponse = objectMapper.readValue(
            reserveResult.getResponse().getContentAsString(), ReserveResponse.class);

        ConfirmRequest confirmRequest = new ConfirmRequest(reserveResponse.reservationId());
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
            .andExpect(status().isOk());

        // STEP 2: Release confirmed reservation (refund scenario)
        ReleaseRequest releaseRequest = new ReleaseRequest(reserveResponse.reservationId());
        mockMvc.perform(post("/tickets/release")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(releaseRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELED"));

        // STEP 3: Verify status changed to CANCELED
        assertThat(reservationRepository.findById(reserveResponse.reservationId()))
            .isPresent()
            .get()
            .satisfies(r -> assertThat(r.getStatus()).isEqualTo(ReservationStatus.CANCELED));
        
        // Note: Stock is NOT restored for CONFIRMED reservations (business rule)
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(90)); // Still 90, not 100
    }
}
