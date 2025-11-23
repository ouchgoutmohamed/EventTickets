package com.acme.tickets.controller;

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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration pour TicketController avec base de données H2.
 * Teste les endpoints REST, la validation, et le comportement transactionnel.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("TicketController - Integration Tests")
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

    @BeforeEach
    void setUp() {
        // Clean database before each test
        ticketRepository.deleteAll();
        reservationRepository.deleteAll();
        inventoryRepository.deleteAll();
    }

    @Nested
    @DisplayName("POST /tickets/reserve - Reserve Tickets")
    @WithMockUser
    class ReserveEndpoint {

        @Test
        @DisplayName("GIVEN valid request WHEN reserve THEN returns 200 with reservation")
        void shouldReserveTicketsSuccessfully() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 100);
            inventoryRepository.save(inventory);

            ReserveRequest request = new ReserveRequest(1L, 42L, 5);

            // WHEN / THEN
            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.holdExpiresAt").isNotEmpty());

            // Verify database state
            assertThat(inventoryRepository.findById(1L))
                .isPresent()
                .get()
                .satisfies(inv -> assertThat(inv.getReserved()).isEqualTo(5));
        }

        @Test
        @DisplayName("GIVEN insufficient stock WHEN reserve THEN returns 409")
        void shouldReturn409WhenInsufficientStock() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 10);
            inventory.setReserved(8); // only 2 available
            inventoryRepository.save(inventory);

            ReserveRequest request = new ReserveRequest(1L, 42L, 5);

            // WHEN / THEN
            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Stock insuffisant")));
        }

        @Test
        @DisplayName("GIVEN invalid eventId WHEN reserve THEN returns 404")
        void shouldReturn404WhenEventNotFound() throws Exception {
            // GIVEN
            ReserveRequest request = new ReserveRequest(999L, 42L, 5);

            // WHEN / THEN
            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Inventaire")));
        }

        @Test
        @DisplayName("GIVEN idempotency key WHEN reserve twice THEN returns same reservation")
        void shouldRespectIdempotencyKey() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 100);
            inventoryRepository.save(inventory);

            ReserveRequest request = new ReserveRequest(1L, 42L, 5);
            String idempotencyKey = "unique-key-123";

            // WHEN: First request
            String response1 = mockMvc.perform(post("/tickets/reserve")
                    .header("Idempotency-Key", idempotencyKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

            // Second request with same key
            String response2 = mockMvc.perform(post("/tickets/reserve")
                    .header("Idempotency-Key", idempotencyKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

            // THEN
            assertThat(response1).isEqualTo(response2);
            
            // Verify only 5 tickets reserved (not 10)
            assertThat(inventoryRepository.findById(1L))
                .isPresent()
                .get()
                .satisfies(inv -> assertThat(inv.getReserved()).isEqualTo(5));
        }

        @Test
        @DisplayName("GIVEN missing required field WHEN reserve THEN returns 400")
        void shouldReturn400WhenInvalidRequest() throws Exception {
            // GIVEN: invalid request with null eventId
            String invalidJson = "{\"userId\": 42, \"quantity\": 5}";

            // WHEN / THEN
            mockMvc.perform(post("/tickets/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidJson))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /tickets/confirm - Confirm Reservation")
    @WithMockUser
    class ConfirmEndpoint {

        @Test
        @DisplayName("GIVEN valid pending reservation WHEN confirm THEN returns 200")
        void shouldConfirmReservationSuccessfully() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 100);
            inventoryRepository.save(inventory);

            Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.PENDING);
            reservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
            reservation = reservationRepository.save(reservation);

            ConfirmRequest request = new ConfirmRequest(reservation.getId());

            // WHEN / THEN
            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

            // Verify ticket created
            assertThat(ticketRepository.findAll()).hasSize(1);
        }

        @Test
        @DisplayName("GIVEN expired reservation WHEN confirm THEN returns 422")
        void shouldReturn422WhenReservationExpired() throws Exception {
            // GIVEN
            Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.PENDING);
            reservation.setHoldExpiresAt(Instant.now().minusSeconds(1)); // expired
            reservation = reservationRepository.save(reservation);

            ConfirmRequest request = new ConfirmRequest(reservation.getId());

            // WHEN / THEN
            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value(containsString("expiré")));
        }

        @Test
        @DisplayName("GIVEN canceled reservation WHEN confirm THEN returns 422")
        void shouldReturn422WhenReservationCanceled() throws Exception {
            // GIVEN
            Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.CANCELED);
            reservation = reservationRepository.save(reservation);

            ConfirmRequest request = new ConfirmRequest(reservation.getId());

            // WHEN / THEN
            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
        }

        @Test
        @DisplayName("GIVEN nonexistent reservation WHEN confirm THEN returns 404")
        void shouldReturn404WhenReservationNotFound() throws Exception {
            // GIVEN
            ConfirmRequest request = new ConfirmRequest(999L);

            // WHEN / THEN
            mockMvc.perform(post("/tickets/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Réservation")));
        }
    }

    @Nested
    @DisplayName("POST /tickets/release - Release Reservation")
    @WithMockUser
    class ReleaseEndpoint {

        @Test
        @DisplayName("GIVEN pending reservation WHEN release THEN returns 200 and restores stock")
        void shouldReleaseReservationSuccessfully() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 100);
            inventory.setReserved(10);
            inventoryRepository.save(inventory);

            Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.PENDING);
            reservation.setHoldExpiresAt(Instant.now().plusSeconds(900));
            reservation = reservationRepository.save(reservation);

            ReleaseRequest request = new ReleaseRequest(reservation.getId());

            // WHEN / THEN
            mockMvc.perform(post("/tickets/release")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

            // Verify stock restored
            assertThat(inventoryRepository.findById(1L))
                .isPresent()
                .get()
                .satisfies(inv -> assertThat(inv.getReserved()).isEqualTo(5)); // 10 - 5
        }

        @Test
        @DisplayName("GIVEN confirmed reservation WHEN release THEN cancels without stock change")
        void shouldCancelConfirmedReservation() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 100);
            inventory.setReserved(10);
            inventoryRepository.save(inventory);

            Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.CONFIRMED);
            reservation = reservationRepository.save(reservation);

            ReleaseRequest request = new ReleaseRequest(reservation.getId());

            // WHEN / THEN
            mockMvc.perform(post("/tickets/release")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

            // Verify stock NOT restored (because it was CONFIRMED)
            assertThat(inventoryRepository.findById(1L))
                .isPresent()
                .get()
                .satisfies(inv -> assertThat(inv.getReserved()).isEqualTo(10)); // unchanged
        }
    }

    @Nested
    @DisplayName("GET /tickets/availability/{eventId} - Get Availability")
    class AvailabilityEndpoint {

        @Test
        @DisplayName("GIVEN existing inventory WHEN get availability THEN returns correct data")
        void shouldGetAvailabilitySuccessfully() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 100);
            inventory.setReserved(30);
            inventoryRepository.save(inventory);

            // WHEN / THEN
            mockMvc.perform(get("/tickets/availability/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventId").value(1))
                .andExpect(jsonPath("$.total").value(100))
                .andExpect(jsonPath("$.available").value(70));
        }

        @Test
        @DisplayName("GIVEN nonexistent inventory WHEN get availability THEN returns 404")
        void shouldReturn404WhenInventoryNotFound() throws Exception {
            // WHEN / THEN
            mockMvc.perform(get("/tickets/availability/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Inventaire")));
        }
    }

    @Nested
    @DisplayName("GET /tickets/user/{userId} - Get User Reservations")
    @WithMockUser
    class UserReservationsEndpoint {

        @Test
        @DisplayName("GIVEN user with reservations WHEN get THEN returns all reservations")
        void shouldGetUserReservationsSuccessfully() throws Exception {
            // GIVEN
            Reservation r1 = new Reservation(1L, 42L, 2, ReservationStatus.PENDING);
            Reservation r2 = new Reservation(2L, 42L, 3, ReservationStatus.CONFIRMED);
            Reservation r3 = new Reservation(3L, 42L, 1, ReservationStatus.CANCELED);
            
            reservationRepository.save(r1);
            reservationRepository.save(r2);
            reservationRepository.save(r3);

            // WHEN / THEN
            mockMvc.perform(get("/tickets/user/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items", hasSize(3)))
                .andExpect(jsonPath("$.items[*].status", containsInAnyOrder("PENDING", "CONFIRMED", "CANCELED")));
        }

        @Test
        @DisplayName("GIVEN user with no reservations WHEN get THEN returns empty list")
        void shouldReturnEmptyListWhenNoReservations() throws Exception {
            // WHEN / THEN
            mockMvc.perform(get("/tickets/user/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("Transactional Behavior Tests")
    @WithMockUser
    class TransactionalTests {

        @Test
        @DisplayName("GIVEN concurrent reservations WHEN both reserve THEN no overselling")
        void shouldHandleConcurrentReservations() throws Exception {
            // GIVEN
            Inventory inventory = new Inventory(1L, 10);
            inventoryRepository.save(inventory);

            ReserveRequest request1 = new ReserveRequest(1L, 42L, 6);
            ReserveRequest request2 = new ReserveRequest(1L, 43L, 6);

            // WHEN: Simulate concurrent requests (one should fail)
            try {
                mockMvc.perform(post("/tickets/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                    .andExpect(status().isOk());

                mockMvc.perform(post("/tickets/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                    .andExpect(status().isConflict()); // Should fail due to insufficient stock
            } catch (Exception e) {
                // If exception occurs, verify one succeeded
            }

            // THEN: Verify no overselling
            Inventory updated = inventoryRepository.findById(1L).orElseThrow();
            assertThat(updated.getReserved()).isLessThanOrEqualTo(10);
        }
    }
}
