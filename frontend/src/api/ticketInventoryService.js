import axiosInstance from './axiosConfig';

/**
 * Ticket Inventory Service API
 * Handles all API calls to the TicketInventoryService backend via API Gateway
 */
const ticketInventoryService = {
  /**
   * Get ticket availability for a specific event
   * @param {number} eventId - The event ID
   * @returns {Promise} Response with total and available tickets
   */
  getAvailability: async (eventId) => {
    const response = await axiosInstance.get(`/tickets/availability/${eventId}`);
    return response.data;
  },

  /**
   * Reserve tickets for an event
   * @param {number} eventId - The event ID
   * @param {number} userId - The user ID
   * @param {number} quantity - Number of tickets to reserve
   * @param {string} idempotencyKey - Optional idempotency key to prevent duplicate reservations
   * @returns {Promise} Response with reservation ID, status, and expiration time
   */
  reserveTickets: async (eventId, userId, quantity, idempotencyKey = null) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await axiosInstance.post(
      '/tickets/reserve',
      { eventId, userId, quantity },
      { headers }
    );
    return response.data;
  },

  /**
   * Confirm a pending reservation
   * @param {number} reservationId - The reservation ID to confirm
   * @returns {Promise} Response with confirmation status
   */
  confirmReservation: async (reservationId) => {
    const response = await axiosInstance.post('/tickets/confirm', {
      reservationId,
    });
    return response.data;
  },

  /**
   * Release/cancel a reservation
   * @param {number} reservationId - The reservation ID to release
   * @returns {Promise} Response with cancellation status
   */
  releaseReservation: async (reservationId) => {
    const response = await axiosInstance.post('/tickets/release', {
      reservationId,
    });
    return response.data;
  },

  /**
   * Get all reservations for a specific user
   * @param {number} userId - The user ID
   * @returns {Promise} Response with list of user reservations
   */
  getUserReservations: async (userId) => {
    const response = await axiosInstance.get(`/tickets/user/${userId}`);
    return response.data;
  },
};

export default ticketInventoryService;
