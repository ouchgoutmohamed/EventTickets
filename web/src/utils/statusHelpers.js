import { CheckCircle, AlertCircle, XCircle, Clock, Calendar, Archive, Edit, PlayCircle } from "lucide-react";

export const getStatusConfig = (status) => {
  switch (status) {
    case 'OPEN_FOR_BOOKING':
      return { 
          label: 'Billetterie Ouverte', 
          color: 'bg-green-600 text-white', 
          badgeColor: 'bg-green-100 text-green-800',
          icon: CheckCircle, 
          canBook: true,
          isVisiblePublic: true 
      };
    case 'PUBLISHED':
      return { 
          label: 'Bientôt Disponible', 
          color: 'bg-blue-600 text-white', 
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: Calendar, 
          canBook: false,
          isVisiblePublic: true 
      };
    case 'SOLDOUT':
      return { 
          label: 'SOLDOUT', 
          color: 'bg-red-600 text-white', 
          badgeColor: 'bg-red-100 text-red-800',
          icon: AlertCircle, 
          canBook: false,
          isVisiblePublic: true 
      };
    case 'POSTPONED':
      return { 
          label: 'Reporté', 
          color: 'bg-orange-500 text-white', 
          badgeColor: 'bg-orange-100 text-orange-800',
          icon: Clock, 
          canBook: false,
          isVisiblePublic: true 
      };
    case 'CANCELLED':
      return { 
          label: 'Annulé', 
          color: 'bg-destructive text-white', 
          badgeColor: 'bg-red-50 text-red-600',
          icon: XCircle, 
          canBook: false,
          isVisiblePublic: true 
      };
    case 'COMPLETED':
      return { 
          label: 'Terminé', 
          color: 'bg-slate-600 text-white', 
          badgeColor: 'bg-slate-100 text-slate-600',
          icon: Archive, 
          canBook: false,
          isVisiblePublic: true 
      };
    default: // DRAFT et autres
      return { 
          label: 'Brouillon', 
          color: 'bg-gray-400 text-white', 
          badgeColor: 'bg-gray-100 text-gray-600',
          icon: Edit, 
          canBook: false,
          isVisiblePublic: false 
      };
  }
};