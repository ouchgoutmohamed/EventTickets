import { apiGatewayClient } from '@/api/axiosClients';

/**
 * Service pour la gestion des tickets électroniques.
 * Communique avec l'API Gateway pour récupérer les billets de l'utilisateur.
 */

/**
 * Récupère tous les tickets de l'utilisateur connecté.
 * @returns {Promise<Array>} Liste des tickets
 */
export const getMyTickets = async () => {
  try {
    const response = await apiGatewayClient.get('/tickets/me');
    return response.data.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    throw error;
  }
};

/**
 * Récupère le détail d'un ticket spécifique.
 * @param {string} ticketUuid UUID du ticket
 * @returns {Promise<Object>} Détails du ticket
 */
export const getTicketDetails = async (ticketUuid) => {
  try {
    const response = await apiGatewayClient.get(`/tickets/${ticketUuid}`);
    return response.data.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du ticket ${ticketUuid}:`, error);
    throw error;
  }
};

/**
 * Génère l'URL pour la version imprimable du ticket.
 * @param {string} ticketUuid UUID du ticket
 * @returns {string} URL de la page d'impression
 */
export const getTicketPrintUrl = (ticketUuid) => {
  const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';
  return `${baseUrl}/tickets/${ticketUuid}/print`;
};

/**
 * Génère l'URL pour télécharger le PDF du ticket.
 * @param {string} ticketUuid UUID du ticket
 * @returns {string} URL du PDF
 */
export const getTicketPdfUrl = (ticketUuid) => {
  const baseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';
  return `${baseUrl}/tickets/${ticketUuid}/pdf`;
};

/**
 * Ouvre le ticket dans une nouvelle fenêtre pour impression.
 * @param {string} ticketUuid UUID du ticket
 */
export const openTicketForPrint = (ticketUuid) => {
  const printUrl = getTicketPrintUrl(ticketUuid);
  window.open(printUrl, '_blank', 'width=900,height=700');
};

/**
 * Valide un ticket (scan QR code) - pour les organisateurs.
 * @param {string} qrPayload Payload du QR code scanné
 * @returns {Promise<Object>} Résultat de la validation
 */
export const validateTicket = async (qrPayload) => {
  try {
    const response = await apiGatewayClient.post('/tickets/validate', {
      qr_payload: qrPayload,
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la validation du ticket:', error);
    throw error;
  }
};

export default {
  getMyTickets,
  getTicketDetails,
  getTicketPrintUrl,
  getTicketPdfUrl,
  openTicketForPrint,
  validateTicket,
};
