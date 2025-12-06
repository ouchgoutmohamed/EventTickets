import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  User, 
  Printer, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  CreditCard,
  Tag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTicketDetails } from '@/features/tickets/hooks/useTickets';
import { openTicketForPrint } from '@/features/tickets/services/ticketService';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Page de détails d'un ticket - Affiche un billet imprimable avec QR code.
 * 
 * Cette page affiche toutes les informations du ticket :
 * - Informations de l'événement (titre, date, lieu)
 * - Informations du participant
 * - Type de billet et prix
 * - QR code pour l'entrée
 */
const TicketDetailsPage = () => {
  const { ticketUuid } = useParams();
  const navigate = useNavigate();
  const { ticket, loading, error, refresh } = useTicketDetails(ticketUuid);

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date à confirmer';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Formater l'heure
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // Si c'est un datetime complet
      if (timeString.includes('T') || timeString.includes(' ')) {
        return new Date(timeString).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  // Formater le prix
  const formatPrice = (price) => {
    if (!price && price !== 0) return '0,00 MAD';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(price);
  };

  // Obtenir le style du badge de statut
  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'generated':
      case 'valide':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'used':
      case 'utilisé':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled':
      case 'annulé':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
      case 'expiré':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  // Gérer l'impression
  const handlePrint = () => {
    window.print();
  };

  // Ouvrir la version imprimable du backend
  const handlePrintBackend = () => {
    openTicketForPrint(ticketUuid);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du billet...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Billet introuvable</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={() => navigate('/my-tickets')}>
              Retour à mes billets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pas de ticket
  if (!ticket) {
    return null;
  }

  // Extraire les données du ticket
  const ticketData = ticket.ticket || ticket;
  const eventData = ticket.event || {};
  const userData = ticket.user || {};

  return (
    <>
      {/* Styles d'impression */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        {/* Navigation - caché à l'impression */}
        <div className="max-w-2xl mx-auto mb-6 no-print">
          <Button 
            variant="ghost" 
            className="pl-0 gap-2 text-gray-600 hover:text-gray-900" 
            onClick={() => navigate('/my-tickets')}
          >
            <ArrowLeft size={20} /> Retour à mes billets
          </Button>
        </div>

        {/* Zone imprimable */}
        <div className="print-area max-w-2xl mx-auto">
          {/* Carte du billet */}
          <Card className="overflow-hidden shadow-xl">
            {/* En-tête avec dégradé */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 relative">
              {/* Ligne pointillée décorative */}
              <div className="absolute right-0 top-0 bottom-0 w-px border-r-2 border-dashed border-white/30" 
                   style={{ right: '140px' }}></div>
              
              <div className="flex items-center gap-3 mb-4">
                <Ticket className="h-8 w-8" />
                <h1 className="text-2xl font-bold">BILLET D'ENTRÉE</h1>
              </div>
              
              <h2 className="text-xl font-semibold">
                {eventData.title || `Événement #${ticketData.event_id || ticket.event_id}`}
              </h2>
            </div>

            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Informations du ticket */}
                <div className="flex-1 p-6 space-y-5">
                  {/* Date & Heure */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="uppercase tracking-wide font-medium">Date & Heure</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {formatDate(eventData.date)}
                      {eventData.time && (
                        <span className="text-gray-600"> à {formatTime(eventData.time)}</span>
                      )}
                    </p>
                  </div>

                  {/* Lieu */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="uppercase tracking-wide font-medium">Lieu</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {eventData.location || 'Non spécifié'}
                    </p>
                  </div>

                  {/* Participant */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="uppercase tracking-wide font-medium">Participant</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {userData.name || `Utilisateur #${ticketData.user_id || ticket.user_id}`}
                    </p>
                  </div>

                  {/* Type de billet */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Tag className="h-4 w-4 text-orange-500" />
                      <span className="uppercase tracking-wide font-medium">Type de billet</span>
                    </div>
                    <p className="text-purple-600 font-semibold">
                      {ticketData.type || ticketData.ticket_type || 'Standard'}
                    </p>
                  </div>

                  {/* Prix */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <CreditCard className="h-4 w-4 text-green-500" />
                      <span className="uppercase tracking-wide font-medium">Prix</span>
                    </div>
                    <p className="text-green-600 font-bold text-lg">
                      {formatPrice(ticketData.total_price || ticketData.unit_price)}
                    </p>
                  </div>

                  {/* Statut */}
                  <div>
                    <Badge className={`${getStatusBadgeStyle(ticketData.status)} px-3 py-1`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {ticketData.status_description || ticketData.status || 'Valide'}
                    </Badge>
                  </div>
                </div>

                {/* Section QR Code */}
                <div className="md:w-48 p-6 bg-gray-50 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-gray-300">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <QRCodeSVG 
                      value={ticketData.qr_payload || ticketData.uuid || ticketUuid}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Scannez ce QR code<br />à l'entrée
                  </p>
                </div>
              </div>

              {/* Pied de page du ticket */}
              <Separator />
              <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Émis le {formatDate(ticketData.created_at)}
                  </span>
                </div>
                <div className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                  Réf: {(ticketData.uuid || ticketUuid)?.substring(0, 8).toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 no-print">
            <h3 className="font-medium text-blue-900 mb-2">📋 Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Présentez ce billet (imprimé ou sur mobile) à l'entrée de l'événement.</li>
              <li>• Le QR code sera scanné pour valider votre entrée.</li>
              <li>• Ce billet est personnel et ne peut être utilisé qu'une seule fois.</li>
            </ul>
          </div>

          {/* Boutons d'action - cachés à l'impression */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center no-print">
            <Button 
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer ce billet
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/my-tickets')}
            >
              Retour à mes billets
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetailsPage;
