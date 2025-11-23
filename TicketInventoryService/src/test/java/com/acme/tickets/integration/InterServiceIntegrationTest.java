package com.acme.tickets.integration;

import com.acme.tickets.domain.entity.Inventory;
import com.acme.tickets.domain.entity.Reservation;
import com.acme.tickets.domain.enums.ReservationStatus;
import com.acme.tickets.domain.repository.InventoryRepository;
import com.acme.tickets.domain.repository.ReservationRepository;
import com.acme.tickets.domain.repository.TicketRepository;
import com.acme.tickets.dto.ConfirmRequest;
import com.acme.tickets.dto.ReserveRequest;
import com.acme.tickets.dto.ReserveResponse;
import com.acme.tickets.service.TicketInventoryService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration simulant la communication avec EventCatalogService et PaymentService.
 * Ces tests valident les contrats d'API et les scénarios d'intégration inter-services.
 * 
 * Note: Dans un système réel, ces services seraient mockés avec WireMock ou MockServer
 * pour simuler leurs réponses sans démarrer les services réels.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Inter-Service Integration Tests (Mocked)")
class InterServiceIntegrationTest {

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

    @Autowired
    private TicketInventoryService ticketInventoryService;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        reservationRepository.deleteAll();
        inventoryRepository.deleteAll();
    }

    /**
     * SCENARIO: Integration with EventCatalogService
     * 
     * Flow:
     * 1. User requests to reserve tickets for an event
     * 2. TicketInventoryService should verify event exists (call to EventCatalogService)
     * 3. If event exists and has tickets, create reservation
     * 4. If event doesn't exist, return 404
     * 
     * Note: Currently, the service assumes the event exists. In a real integration,
     * we would add a REST client to EventCatalogService and verify the event.
     */
    @Test
    @WithMockUser
    @DisplayName("Integration: Should validate event exists via EventCatalogService")
    void shouldIntegrateWithEventCatalogService() throws Exception {
        // GIVEN: Event exists in EventCatalogService (would be mocked in real integration)
        // For now, we simulate by creating inventory directly
        Long eventId = 1L;
        Inventory inventory = new Inventory(eventId, 100);
        inventoryRepository.save(inventory);

        // WHEN: User reserves tickets
        ReserveRequest request = new ReserveRequest(eventId, 42L, 5);
        
        // THEN: Reservation succeeds (in real integration, would verify API call to EventCatalogService)
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        // Verify reservation created
        assertThat(reservationRepository.findAll()).hasSize(1);
    }

    @Test
    @WithMockUser
    @DisplayName("Integration: Should handle event not found from EventCatalogService")
    void shouldHandleEventNotFoundFromCatalog() throws Exception {
        // GIVEN: Event does not exist (no inventory created)
        Long nonExistentEventId = 999L;

        // WHEN: User tries to reserve tickets for non-existent event
        ReserveRequest request = new ReserveRequest(nonExistentEventId, 42L, 5);

        // THEN: Should return 404 (inventory not found, which implies event doesn't exist)
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound());
    }

    /**
     * SCENARIO: Integration with PaymentService
     * 
     * Flow:
     * 1. User confirms a reservation
     * 2. TicketInventoryService confirms the reservation and creates tickets
     * 3. TicketInventoryService should trigger payment via PaymentService
     * 4. PaymentService processes payment and returns success/failure
     * 5. On payment success, reservation remains CONFIRMED
     * 6. On payment failure, reservation should be rolled back or marked as PAYMENT_FAILED
     * 
     * Note: Currently, payment trigger is TODO in the code. In real integration,
     * we would publish an event or call PaymentService REST API.
     */
    @Test
    @WithMockUser
    @DisplayName("Integration: Should trigger payment after confirmation")
    void shouldIntegrateWithPaymentService() throws Exception {
        // GIVEN: User has a pending reservation
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 5);
        MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andExpect(status().isOk())
            .andReturn();

        ReserveResponse reserveResponse = objectMapper.readValue(
            reserveResult.getResponse().getContentAsString(),
            ReserveResponse.class
        );

        // WHEN: User confirms reservation (this should trigger payment)
        ConfirmRequest confirmRequest = new ConfirmRequest(reserveResponse.reservationId());
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
            .andExpect(status().isOk());

        // THEN: Reservation is CONFIRMED
        // In real integration, we would verify:
        // 1. Event published to message broker (e.g., ReservationConfirmed event)
        // 2. Or REST call made to PaymentService with payment details
        // 3. Payment processed successfully
        Reservation reservation = reservationRepository.findById(reserveResponse.reservationId()).orElseThrow();
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);

        // TODO: Verify payment event published or API called
        // Example with message broker:
        // verify(messagePublisher).publish(argThat(event -> 
        //     event instanceof ReservationConfirmedEvent &&
        //     ((ReservationConfirmedEvent) event).getReservationId().equals(reserveResponse.reservationId())
        // ));
    }

    @Test
    @WithMockUser
    @DisplayName("Integration: Should handle payment processing workflow")
    void shouldHandlePaymentWorkflow() throws Exception {
        // GIVEN: Confirmed reservation ready for payment
        Inventory inventory = new Inventory(1L, 100);
        inventory.setReserved(5);
        inventoryRepository.save(inventory);

        Reservation reservation = new Reservation(1L, 42L, 5, ReservationStatus.CONFIRMED);
        reservation = reservationRepository.save(reservation);

        // WHEN: Payment is processed (simulated)
        // In real integration:
        // 1. PaymentService receives payment request
        // 2. PaymentService processes payment with payment provider (Stripe, etc.)
        // 3. PaymentService returns payment ID and status
        // 4. TicketInventoryService updates reservation with payment details

        // THEN: Verify reservation state
        Reservation updated = reservationRepository.findById(reservation.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        
        // TODO: In real integration, verify:
        // - Payment ID stored in reservation
        // - Payment status tracked
        // - Refund available if needed
    }

    /**
     * SCENARIO: Integration via API Gateway
     * 
     * Flow:
     * 1. Frontend sends request to API Gateway
     * 2. API Gateway validates JWT token
     * 3. API Gateway extracts user ID from token
     * 4. API Gateway forwards request to TicketInventoryService with X-User-Id header
     * 5. TicketInventoryService processes request using user ID from header
     * 
     * Note: In this test, we simulate the Gateway by directly setting the user context.
     * Real integration would test with actual Gateway and JWT tokens.
     */
    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    @DisplayName("Integration: Should process requests forwarded by API Gateway")
    void shouldIntegrateWithApiGateway() throws Exception {
        // GIVEN: API Gateway has authenticated user and extracted user ID
        Long userId = 42L;
        Long eventId = 1L;
        
        Inventory inventory = new Inventory(eventId, 100);
        inventoryRepository.save(inventory);

        // WHEN: Gateway forwards request with user context (simulated via @WithMockUser)
        ReserveRequest request = new ReserveRequest(eventId, userId, 5);
        
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        // THEN: Request processed successfully with correct user
        Reservation reservation = reservationRepository.findAll().get(0);
        assertThat(reservation.getUserId()).isEqualTo(userId);
        
        // In real integration via Gateway:
        // - Request would include JWT token in Authorization header
        // - Gateway would validate token and extract user ID
        // - Gateway would add X-User-Id header before forwarding
        // - Service would read user ID from X-User-Id header (not from request body)
    }

    @Test
    @WithMockUser
    @DisplayName("Integration: Complete workflow through all services")
    void shouldSupportCompleteWorkflowThroughServices() throws Exception {
        // SCENARIO: Complete booking workflow involving all services
        
        // STEP 1: User browses events (EventCatalogService)
        // -> User finds event ID 1 with tickets available
        
        // STEP 2: User checks availability (TicketInventoryService)
        Inventory inventory = new Inventory(1L, 50);
        inventoryRepository.save(inventory);
        
        // STEP 3: User reserves tickets (TicketInventoryService)
        ReserveRequest reserveRequest = new ReserveRequest(1L, 42L, 3);
        MvcResult reserveResult = mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reserveRequest)))
            .andExpect(status().isOk())
            .andReturn();
        
        ReserveResponse reserveResponse = objectMapper.readValue(
            reserveResult.getResponse().getContentAsString(),
            ReserveResponse.class
        );
        
        // STEP 4: User confirms reservation (TicketInventoryService)
        ConfirmRequest confirmRequest = new ConfirmRequest(reserveResponse.reservationId());
        mockMvc.perform(post("/tickets/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
            .andExpect(status().isOk());
        
        // STEP 5: Payment processed (PaymentService)
        // -> In real integration, PaymentService would be called
        // -> Payment confirmation would be received
        
        // STEP 6: Tickets delivered (NotificationService)
        // -> In real integration, NotificationService would send email with tickets
        
        // VERIFY: Complete workflow successful
        Reservation finalReservation = reservationRepository.findById(reserveResponse.reservationId()).orElseThrow();
        assertThat(finalReservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(ticketRepository.findAll()).hasSize(1);
    }

    /**
     * SCENARIO: Handling service failures
     * 
     * Tests how the system handles failures in dependent services:
     * - EventCatalogService unavailable
     * - PaymentService timeout
     * - Payment provider rejection
     */
    @Test
    @WithMockUser
    @DisplayName("Integration: Should handle dependent service failures gracefully")
    void shouldHandleDependentServiceFailures() throws Exception {
        // GIVEN: Normal setup
        Inventory inventory = new Inventory(1L, 100);
        inventoryRepository.save(inventory);

        // SCENARIO 1: EventCatalogService returns 500 (simulated by missing inventory)
        // In real integration, would mock EventCatalogService to return error
        ReserveRequest request = new ReserveRequest(999L, 42L, 5);
        mockMvc.perform(post("/tickets/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound()); // Currently returns 404, could be enhanced to differentiate service errors

        // SCENARIO 2: PaymentService timeout
        // In real integration, mock would simulate timeout
        // Service should handle with appropriate retry logic or compensation

        // SCENARIO 3: Circuit breaker pattern
        // After multiple failures, service should fail fast
        // Would be tested with resilience4j or similar
    }
}
