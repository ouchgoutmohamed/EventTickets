import { apiGatewayClient } from '@/api/axiosClients';

/**
 * Service pour la gestion des paiements.
 * Communique avec l'API Gateway vers le PaymentService (Laravel).
 */

/**
 * Exécute un paiement pour une réservation.
 * Le backend génère automatiquement un ticket électronique après paiement réussi.
 * 
 * @param {Object} data - Données du paiement
 * @param {number} data.user_id - ID de l'utilisateur
 * @param {number} data.event_id - ID de l'événement
 * @param {number} data.ticket_id - ID du type de ticket (catégorie)
 * @param {string} data.reservation_id - ID de la réservation
 * @param {number} data.amount - Montant en centimes
 * @param {string} data.currency - Devise (default: MAD)
 * @param {string} data.method - Méthode de paiement (credit_card, paypal, etc.)
 * @returns {Promise<Object>} Résultat du paiement avec le ticket généré
 */
export const executePayment = async (data) => {
  try {
    const response = await apiGatewayClient.post('/payments', {
      user_id: data.user_id,
      event_id: data.event_id,
      ticket_id: data.ticket_id || 1,
      reservation_id: data.reservation_id,
      amount: data.amount,
      currency: data.currency || 'MAD',
      method: data.method || 'Credit Card',
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du paiement:', error);
    throw error;
  }
};

/**
 * Récupère les paiements d'un utilisateur.
 * 
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des paiements
 */
export const getUserPayments = async (userId) => {
  try {
    const response = await apiGatewayClient.get('/payments', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    throw error;
  }
};

/**
 * Récupère le détail d'un paiement.
 * 
 * @param {number} paymentId - ID du paiement
 * @returns {Promise<Object>} Détails du paiement
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const response = await apiGatewayClient.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    throw error;
  }
};

export default {
  executePayment,
  getUserPayments,
  getPaymentDetails,
};
