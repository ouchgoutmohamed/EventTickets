import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';
import { useAvailability } from '../hooks/useAvailability';

/**
 * Composant pour afficher la disponibilité des tickets en temps réel
 * @param {number} eventId - L'identifiant de l'événement
 * @param {boolean} enablePolling - Active le polling automatique (défaut: false)
 * @param {number} pollingInterval - Intervalle de polling en ms (défaut: 30000)
 */
const AvailabilityBadge = ({ eventId, enablePolling = false, pollingInterval = 30000 }) => {
  const { availability, loading, error } = useAvailability(eventId, { 
    enablePolling, 
    pollingInterval 
  });

  // Gestion de l'état de chargement
  if (loading && !availability) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Spinner size={12} />
        <span>Chargement...</span>
      </Badge>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <AlertCircle size={14} />
        <span>Indisponible</span>
      </Badge>
    );
  }

  // Si pas de données disponibles
  if (!availability) {
    return null;
  }

  const { available, total } = availability;
  
  // Déterminer la couleur et le texte selon la disponibilité
  const getAvailabilityStatus = () => {
    if (available === 0) {
      return {
        variant: 'destructive',
        text: 'Épuisé',
        className: 'bg-red-100 text-red-700 border-red-200'
      };
    }
    
    const percentageAvailable = (available / total) * 100;
    
    if (percentageAvailable <= 10) {
      return {
        variant: 'warning',
        text: `Plus que ${available} places`,
        className: 'bg-orange-100 text-orange-700 border-orange-200'
      };
    }
    
    if (percentageAvailable <= 25) {
      return {
        variant: 'default',
        text: `${available} places disponibles`,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      };
    }
    
    return {
      variant: 'success',
      text: `${available} places disponibles`,
      className: 'bg-green-100 text-green-700 border-green-200'
    };
  };

  const status = getAvailabilityStatus();

  return (
    <Badge className={`${status.className} border font-medium`}>
      {status.text}
    </Badge>
  );
};

export default AvailabilityBadge;
