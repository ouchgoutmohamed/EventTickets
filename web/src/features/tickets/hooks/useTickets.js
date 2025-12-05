import { useState, useEffect, useCallback } from 'react';
import { getMyTickets, getTicketDetails, openTicketForPrint } from '../services/ticketService';

/**
 * Hook personnalisé pour gérer les tickets de l'utilisateur.
 * Fournit les fonctions et états nécessaires pour :
 * - Charger la liste des tickets
 * - Afficher le détail d'un ticket
 * - Ouvrir un ticket pour impression
 */
export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charge tous les tickets de l'utilisateur.
   */
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Impossible de récupérer vos billets';
      setError(errorMessage);
      console.error('Erreur fetchTickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Ouvre un ticket pour impression dans une nouvelle fenêtre.
   */
  const printTicket = useCallback((ticketUuid) => {
    openTicketForPrint(ticketUuid);
  }, []);

  /**
   * Rafraîchit la liste des tickets.
   */
  const refresh = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Charger les tickets au montage du composant
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refresh,
    printTicket,
    fetchTickets,
  };
};

/**
 * Hook pour gérer le détail d'un ticket spécifique.
 */
export const useTicketDetails = (ticketUuid) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketUuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getTicketDetails(ticketUuid);
      setTicket(data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Impossible de récupérer les détails du billet';
      setError(errorMessage);
      console.error('Erreur fetchTicket:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketUuid]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return {
    ticket,
    loading,
    error,
    refresh: fetchTicket,
  };
};

export default useTickets;
