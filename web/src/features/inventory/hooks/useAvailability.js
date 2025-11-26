import { useState, useEffect, useCallback } from 'react';
import { getAvailability } from '../services/inventoryService';

/**
 * Hook personnalisé pour gérer la disponibilité des tickets d'un événement
 * @param {number} eventId - L'identifiant de l'événement
 * @param {Object} options - Options de configuration
 * @param {boolean} options.enablePolling - Active le polling automatique (défaut: false)
 * @param {number} options.pollingInterval - Intervalle de polling en ms (défaut: 30000)
 * @returns {Object} {availability, loading, error, refetch}
 */
export const useAvailability = (eventId, options = {}) => {
  const { enablePolling = false, pollingInterval = 30000 } = options;
  
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailability = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setError(null);
      const data = await getAvailability(eventId);
      setAvailability(data);
    } catch (err) {
      console.error('Erreur lors de la récupération de la disponibilité:', err);
      setError(err.response?.data?.message || 'Impossible de récupérer la disponibilité');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Premier chargement
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Polling automatique si activé
  useEffect(() => {
    if (!enablePolling || !eventId) return;

    const interval = setInterval(() => {
      fetchAvailability();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollingInterval, eventId, fetchAvailability]);

  return { 
    availability, 
    loading, 
    error, 
    refetch: fetchAvailability 
  };
};
