import React from 'react';
import { Ticket, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import TicketCard from './TicketCard';

/**
 * Composant pour afficher la liste des tickets de l'utilisateur.
 */
const TicketList = ({ tickets, loading, error, onRefresh, onPrint, onViewDetails }) => {
  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={40} />
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </Alert>
    );
  }

  // État vide
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Ticket className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun billet trouvé
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Vous n'avez pas encore de billets. Réservez des places pour un événement 
          et finalisez votre paiement pour obtenir vos billets électroniques.
        </p>
        <Button 
          variant="outline" 
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir
        </Button>
      </div>
    );
  }

  // Affichage de la liste
  return (
    <div className="space-y-4">
      {/* En-tête avec compteur et bouton de rafraîchissement */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {tickets.length} billet{tickets.length > 1 ? 's' : ''} trouvé{tickets.length > 1 ? 's' : ''}
        </p>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Grille de tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id || ticket.ticket_uuid}
            ticket={ticket}
            onPrint={onPrint}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default TicketList;
