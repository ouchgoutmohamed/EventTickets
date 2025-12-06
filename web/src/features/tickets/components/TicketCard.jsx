import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Printer, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Composant pour afficher une carte de ticket dans la liste.
 * Affiche les informations principales du ticket avec les actions disponibles.
 */
const TicketCard = ({ ticket, onPrint, onViewDetails }) => {
  const navigate = useNavigate();
  // Fonction pour formater la date
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

  // Fonction pour obtenir le style du badge de statut
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'generated':
      case 'valide':
        return 'success';
      case 'used':
      case 'utilisé':
        return 'secondary';
      case 'canceled':
      case 'annulé':
        return 'destructive';
      case 'expired':
      case 'expiré':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'generated':
      case 'valide':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'used':
      case 'utilisé':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'canceled':
      case 'annulé':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
      case 'expiré':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  // Naviguer vers les détails
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(ticket.ticket_uuid);
    } else {
      navigate(`/my-tickets/${ticket.ticket_uuid}`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="flex">
        {/* Contenu principal */}
        <div className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {ticket.event?.title || ticket.eventTitle || `Événement #${ticket.event_id}`}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <span className="font-mono text-xs">
                      Réf: {ticket.ticket_uuid?.substring(0, 8).toUpperCase()}
                    </span>
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(ticket.status)} className="flex items-center gap-1">
                {getStatusIcon(ticket.status)}
                <span>{ticket.status_description || ticket.status}</span>
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Informations de l'événement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span>{formatDate(ticket.event?.date || ticket.eventDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{ticket.event?.location || ticket.eventLocation || 'Lieu à confirmer'}</span>
              </div>
            </div>

            {/* Détails du ticket */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-xs text-gray-500 uppercase">Type</span>
                <p className="font-medium text-purple-600">{ticket.ticket_type || 'Standard'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase">Prix</span>
                <p className="font-bold text-lg text-green-600">
                  {ticket.total_price || ticket.unit_price || 0} MAD
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onPrint(ticket.ticket_uuid)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={ticket.status?.toLowerCase() === 'canceled'}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button 
                variant="outline"
                onClick={handleViewDetails}
                className="flex-1"
              >
                Voir détails
              </Button>
            </div>
          </CardContent>
        </div>

        {/* Mini QR Code sur la droite */}
        <div className="hidden md:flex w-32 bg-gray-50 border-l border-dashed border-gray-200 items-center justify-center p-3">
          <div className="text-center">
            <div className="bg-white p-2 rounded shadow-sm mb-2">
              <QRCodeSVG 
                value={ticket.qr_payload || ticket.ticket_uuid || 'ticket'}
                size={80}
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400">Scanner à l'entrée</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TicketCard;
