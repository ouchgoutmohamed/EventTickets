import { catalogClient } from './axiosClients';

/**
 * Service pour gérer les statistiques des événements de l'organisateur
 * Note: Les statistiques de vente sont gérées par TicketInventoryService
 */

/**
 * Récupérer toutes les statistiques de l'organisateur
 * @returns {Promise} Statistiques complètes d'événements
 */
export const getOrganizerStats = async () => {
  const response = await catalogClient.get('/stats/organizer');
  return response.data;
};

/**
 * Récupérer les statistiques par catégorie d'événement
 * @returns {Promise} Statistiques détaillées par catégorie
 */
export const getCategoryStats = async () => {
  const response = await catalogClient.get('/stats/organizer/categories');
  return response.data;
};

/**
 * Récupérer les statistiques temporelles des événements
 * @returns {Promise} Distribution temporelle des événements
 */
export const getTimelineStats = async () => {
  const response = await catalogClient.get('/stats/organizer/timeline');
  return response.data;
};

export default {
  getOrganizerStats,
  getCategoryStats,
  getTimelineStats
};
