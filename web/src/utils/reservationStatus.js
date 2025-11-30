import { Clock, Shield, X, AlertTriangle } from 'lucide-react';

export const RESERVATION_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
};

/**
 * Retourne la configuration d'affichage pour un statut de réservation
 * @param {string} status - Le statut de la réservation
 * @returns {Object} Configuration avec label, variant, icon
 */
export const getReservationStatusConfig = (status) => {
  const configs = {
    PENDING: { 
      label: 'En attente', 
      variant: 'warning', 
      icon: Clock,
      badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    CONFIRMED: { 
      label: 'Confirmée', 
      variant: 'success', 
      icon: Shield,
      badgeColor: 'bg-green-100 text-green-700 border-green-200'
    },
    CANCELED: { 
      label: 'Annulée', 
      variant: 'secondary', 
      icon: X,
      badgeColor: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    EXPIRED: { 
      label: 'Expirée', 
      variant: 'destructive', 
      icon: AlertTriangle,
      badgeColor: 'bg-red-100 text-red-700 border-red-200'
    }
  };
  return configs[status] || configs.PENDING;
};
