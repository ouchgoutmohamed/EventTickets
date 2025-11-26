import { apiGatewayClient } from '@/api/axiosClients';

/**
 * INT-019: Consulter la disponibilité des tickets pour un événement
 * @param {number} eventId - L'identifiant de l'événement
 * @returns {Promise<{eventId: number, total: number, available: number}>}
 */
export const getAvailability = async (eventId) => {
  const response = await apiGatewayClient.get(
    `/inventory/availability/${eventId}`
  );
  return response.data;
};

/**
 * INT-016: Réservation de tickets pour un événement
 * @param {Object} data - Les détails de la réservation
 * @param {number} data.eventId - L'identifiant de l'événement
 * @param {number} data.userId - L'identifiant de l'utilisateur
 * @param {number} data.quantity - La quantité de tickets à réserver
 * @returns {Promise<{reservationId: string, status: string, holdExpiresAt: string}>}
 */
export const reserveTickets = async (data) => {
  const response = await apiGatewayClient.post(
    '/inventory/reserve', 
    data
  );
  return response.data;
};

/**
 * INT-017: Confirmation d'une réservation
 * @param {string} reservationId - L'identifiant de la réservation
 * @returns {Promise<{reservationId: string, status: string}>}
 */
export const confirmReservation = async (reservationId) => {
  const response = await apiGatewayClient.post(
    '/inventory/confirm',
    { reservationId }
  );
  return response.data;
};

/**
 * INT-018: Libération (annulation) d'une réservation
 * @param {string} reservationId - L'identifiant de la réservation
 * @returns {Promise<{reservationId: string, status: string}>}
 */
export const releaseReservation = async (reservationId) => {
  const response = await apiGatewayClient.post(
    '/inventory/release',
    { reservationId }
  );
  return response.data;
};

/**
 * INT-020: Consulter les réservations et achats d'un utilisateur
 * @param {number} userId - L'identifiant de l'utilisateur
 * @returns {Promise<{reservations: Array}>}
 */
export const getUserReservations = async (userId) => {
  const response = await apiGatewayClient.get(
    `/inventory/user/${userId}`
  );
  return response.data;
};
