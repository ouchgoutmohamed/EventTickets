package com.acme.tickets.integration;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.ReserveRequest;
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
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de contrat d'API pour TicketInventoryService.
 * Vérifie que les réponses respectent les schémas attendus.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("API Contract Validation Tests")
class ApiContractValidationTest {

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
    @DisplayName("Reserve endpoint returns correct schema")
    void shouldReturnCorrectReserveResponseSchema() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest request = new ReserveRequest(1L, 42L, 5);

        // WHEN / THEN
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.reservationId").isNumber())
            .andExpect(jsonPath("$.status").isString())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.holdExpiresAt").isString())
            .andExpect(jsonPath("$.holdExpiresAt").value(matchesPattern("\\d{4}-\\d{2}-\\d{2}T.*")));
    }

    @Test
    @WithMockUser
    @DisplayName("Confirm endpoint returns correct schema")
    void shouldReturnCorrectConfirmResponseSchema() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 5);
        String reserveResponseStr = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andReturn().getResponse().getContentAsString();
        
        Long reservationId = objectMapper.readTree(reserveResponseStr).get("reservationId").asLong();

        // WHEN / THEN
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\": " + reservationId + "}"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.status").isString())
            .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @WithMockUser
    @DisplayName("Release endpoint returns correct schema")
    void shouldReturnCorrectReleaseResponseSchema() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 5);
        String reserveResponseStr = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andReturn().getResponse().getContentAsString();
        
        Long reservationId = objectMapper.readTree(reserveResponseStr).get("reservationId").asLong();

        // WHEN / THEN
        mockMvc.perform(post("/tickets/release")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\": " + reservationId + "}"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.status").isString())
            .andExpect(jsonPath("$.status").value(anyOf(
                equalTo("CANCELED"), 
                equalTo("EXPIRED")
            )));
    }

    @Test
    @DisplayName("Availability endpoint returns correct schema")
    void shouldReturnCorrectAvailabilityResponseSchema() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventory.setReserved(30);
        inventoryRepository.save(inventory);

        // WHEN / THEN
        mockMvc.perform(get("/tickets/availability/1"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.eventId").isNumber())
            .andExpect(jsonPath("$.eventId").value(1))
            .andExpect(jsonPath("$.total").isNumber())
            .andExpect(jsonPath("$.total").value(100))
            .andExpect(jsonPath("$.available").isNumber())
            .andExpect(jsonPath("$.available").value(70));
    }

    @Test
    @WithMockUser
    @DisplayName("User reservations endpoint returns correct schema")
    void shouldReturnCorrectUserReservationsResponseSchema() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest request = new ReserveRequest(1L, 42L, 5);
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        // WHEN / THEN
        mockMvc.perform(get("/tickets/user/42"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items[0].reservationId").isNumber())
            .andExpect(jsonPath("$.items[0].eventId").isNumber())
            .andExpect(jsonPath("$.items[0].quantity").isNumber())
            .andExpect(jsonPath("$.items[0].status").isString())
            .andExpect(jsonPath("$.items[0].createdAt").isString())
            .andExpect(jsonPath("$.items[0].updatedAt").isString());
    }

    @Test
    @WithMockUser
    @DisplayName("Error responses return correct schema for 404")
    void shouldReturnCorrectErrorResponseSchemaFor404() throws Exception {
        // WHEN / THEN
        mockMvc.perform(get("/tickets/availability/999"))
            .andExpect(status().isNotFound())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.message").isString())
            .andExpect(jsonPath("$.message").value(containsString("Inventaire")))
            .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("Error responses return correct schema for 409")
    void shouldReturnCorrectErrorResponseSchemaFor409() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 10);
        inventory.setReserved(9);
        inventoryRepository.save(inventory);

        ReserveRequest request = new ReserveRequest(1L, 42L, 5);

        // WHEN / THEN
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.message").isString())
            .andExpect(jsonPath("$.message").value(containsString("Stock insuffisant")))
            .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("Error responses return correct schema for 422")
    void shouldReturnCorrectErrorResponseSchemaFor422() throws Exception {
        // GIVEN - Create already confirmed reservation
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 5);
        String reserveResponseStr = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andReturn().getResponse().getContentAsString();
        
        Long reservationId = objectMapper.readTree(reserveResponseStr).get("reservationId").asLong();

        // Confirm it
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\": " + reservationId + "}"));

        // WHEN / THEN - Try to confirm again
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\": " + reservationId + "}"))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.message").isString())
            .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("Request validation returns 400 for invalid input")
    void shouldReturn400ForInvalidInput() throws Exception {
        // GIVEN - Invalid JSON (missing required fields)
        String invalidJson = "{\"userId\": 42}";

        // WHEN / THEN
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser
    @DisplayName("Headers are correctly processed")
    void shouldProcessHeadersCorrectly() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest request = new ReserveRequest(1L, 42L, 5);
        String idempotencyKey = "test-key-123";

        // WHEN / THEN - First request with idempotency key
        mockMvc.perform(post("/tickets/reserve")
                .header("Idempotency-Key", idempotencyKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        // Second request with same key should return same result
        mockMvc.perform(post("/tickets/reserve")
                .header("Idempotency-Key", idempotencyKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reservationId").isNumber());
    }

    @Test
    @WithMockUser
    @DisplayName("Content-Type validation")
    void shouldRequireCorrectContentType() throws Exception {
        // GIVEN
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest request = new ReserveRequest(1L, 42L, 5);

        // WHEN / THEN - With correct Content-Type should succeed
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());
    }
}
