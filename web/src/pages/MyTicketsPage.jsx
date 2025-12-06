import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import TicketList from '@/features/tickets/components/TicketList';
import { useTickets, openTicketForPrint } from '@/features/tickets';

/**
 * Page "Mes Billets" - Affiche tous les billets électroniques de l'utilisateur.
 * 
 * Cette page permet à l'utilisateur de :
 * - Voir la liste de tous ses billets
 * - Imprimer un billet (ouvre une nouvelle fenêtre)
 * - Voir les détails d'un billet
 */
const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { info } = useToast();
  const { tickets, loading, error, refresh, printTicket } = useTickets();

  // Gérer l'impression d'un ticket
  const handlePrint = (ticketUuid) => {
    info('Ouverture du billet pour impression...');
    printTicket(ticketUuid);
  };

  // Naviguer vers les détails d'un ticket
  const handleViewDetails = (ticketUuid) => {
    navigate(`/my-tickets/${ticketUuid}`);
  };

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connexion requise
          </h2>
          <p className="text-gray-500 mb-6">
            Vous devez être connecté pour voir vos billets.
          </p>
          <Button onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête de la page */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="pl-0 gap-2 text-gray-500 hover:text-gray-900 mb-4" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> Retour
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Ticket className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Mes Billets
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez et imprimez vos billets électroniques
            </p>
          </div>
        </div>
      </div>

      {/* Liste des tickets */}
      <TicketList
        tickets={tickets}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onPrint={handlePrint}
        onViewDetails={handleViewDetails}
      />

      {/* Note d'information */}
      {tickets && tickets.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>💡 Conseil :</strong> Présentez votre billet (imprimé ou sur mobile) 
            à l'entrée de l'événement. Le QR code sera scanné pour valider votre entrée.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
