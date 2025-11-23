import axios from 'axios';

// Ticket Inventory Service base URL
const TICKET_INVENTORY_API_URL = import.meta.env.VITE_TICKET_INVENTORY_API_URL || 'http://localhost:8082';

// Create a dedicated axios instance for ticket inventory service
const ticketInventoryAxios = axios.create({
  baseURL: TICKET_INVENTORY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
ticketInventoryAxios.interceptors.request.use(
  (config) => {
    console.log(`[Ticket Inventory API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Ticket Inventory API Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
ticketInventoryAxios.interceptors.response.use(
  (response) => {
    console.log(`[Ticket Inventory API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('[Ticket Inventory API Response Error]', error.response?.status, error.response?.data || error.message);
    
    // If 401, force logout and redirect to login
    // Note: Using window.location for hard redirect on authentication failure
    // This ensures all auth state is cleared across the app
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Ticket Inventory Service API
 * Handles all API calls to the TicketInventoryService backend
 */
const ticketInventoryService = {
  /**
   * Get ticket availability for a specific event
   * @param {number} eventId - The event ID
   * @returns {Promise} Response with total and available tickets
   */
  getAvailability: async (eventId) => {
    const response = await ticketInventoryAxios.get(`/tickets/availability/${eventId}`);
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

    const response = await ticketInventoryAxios.post(
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
    const response = await ticketInventoryAxios.post('/tickets/confirm', {
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
    const response = await ticketInventoryAxios.post('/tickets/release', {
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
    const response = await ticketInventoryAxios.get(`/tickets/user/${userId}`);
    return response.data;
  },
};

export default ticketInventoryService;
