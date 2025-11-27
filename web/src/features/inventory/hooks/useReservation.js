import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { 
  reserveTickets as reserveTicketsAPI, 
  confirmReservation as confirmReservationAPI,
  releaseReservation as releaseReservationAPI
} from '../services/inventoryService';

/**
 * Hook personnalisé pour gérer les opérations de réservation
 * @returns {Object} {reserve, confirm, release, loading}
 */
export const useReservation = () => {
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  /**
   * Réserver des tickets pour un événement
   * @param {number} eventId - L'identifiant de l'événement
   * @param {number} quantity - La quantité de tickets à réserver
   * @returns {Promise<Object>} La réponse de l'API
   */
  const reserve = async (eventId, quantity) => {
    if (!user || !user.id) {
      showError('Vous devez être connecté pour réserver des tickets');
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const response = await reserveTicketsAPI({
        eventId,
        userId: user.id,
        quantity
      });
      
      success('Réservation créée avec succès ! Vous avez 15 minutes pour confirmer.');
      return response;
    } catch (err) {
      console.error('Erreur lors de la réservation:', err);
      
      // Gestion des erreurs spécifiques
      if (err.response?.status === 409) {
        showError('Stock insuffisant ou réservation déjà existante');
      } else if (err.response?.status === 404) {
        showError('Événement non trouvé');
      } else {
        showError(err.response?.data?.message || 'Erreur lors de la réservation');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmer une réservation
   * @param {string} reservationId - L'identifiant de la réservation
   * @returns {Promise<Object>} La réponse de l'API
   */
  const confirm = async (reservationId) => {
    setLoading(true);
    try {
      const response = await confirmReservationAPI(reservationId);
      success('Réservation confirmée avec succès !');
      return response;
    } catch (err) {
      console.error('Erreur lors de la confirmation:', err);
      
      if (err.response?.status === 409) {
        showError('La réservation a expiré ou est dans un état invalide');
      } else if (err.response?.status === 404) {
        showError('Réservation non trouvée');
      } else {
        showError(err.response?.data?.message || 'Erreur lors de la confirmation');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Annuler une réservation
   * @param {string} reservationId - L'identifiant de la réservation
   * @returns {Promise<Object>} La réponse de l'API
   */
  const release = async (reservationId) => {
    setLoading(true);
    try {
      const response = await releaseReservationAPI(reservationId);
      success('Réservation annulée avec succès');
      return response;
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      
      if (err.response?.status === 404) {
        showError('Réservation non trouvée');
      } else {
        showError(err.response?.data?.message || 'Erreur lors de l\'annulation');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { reserve, confirm, release, loading };
};
