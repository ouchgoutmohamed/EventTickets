import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  Users, 
  TrendingUp, 
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/context/ToastContext';
import { getMyEvents } from '@/features/catalog/services/eventService';
import { getAvailability } from '@/features/inventory/services/inventoryService';

const OrganizerTicketsPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [events, setEvents] = useState([]);
  const [ticketStats, setTicketStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const eventsData = await getMyEvents();
      const eventsList = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsList);

      // Récupérer les stats de disponibilité pour chaque événement
      const statsPromises = eventsList.map(async (event) => {
        try {
          const availability = await getAvailability(event.id);
          return { eventId: event.id, ...availability };
        } catch (err) {
          console.error(`Erreur disponibilité pour event ${event.id}:`, err);
          return { eventId: event.id, total: 0, available: 0, error: true };
        }
      });

      const stats = await Promise.all(statsPromises);
      const statsMap = {};
      stats.forEach(s => {
        statsMap[s.eventId] = s;
      });
      setTicketStats(statsMap);
    } catch (err) {
      console.error(err);
      showError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Calculer les statistiques globales
  const globalStats = {
    totalEvents: events.length,
    totalTickets: Object.values(ticketStats).reduce((sum, s) => sum + (s.total || 0), 0),
    soldTickets: Object.values(ticketStats).reduce((sum, s) => sum + ((s.total || 0) - (s.available || 0)), 0),
    availableTickets: Object.values(ticketStats).reduce((sum, s) => sum + (s.available || 0), 0),
  };

  const getSoldCount = (eventId) => {
    const stats = ticketStats[eventId];
    if (!stats) return 0;
    return (stats.total || 0) - (stats.available || 0);
  };

  const getSoldPercentage = (eventId) => {
    const stats = ticketStats[eventId];
    if (!stats || stats.total === 0) return 0;
    return Math.round(((stats.total - stats.available) / stats.total) * 100);
  };

  const getStatusBadge = (status) => {
    const config = {
      DRAFT: { label: 'Brouillon', variant: 'secondary', icon: Clock },
      PUBLISHED: { label: 'Publié', variant: 'default', icon: CheckCircle },
      CANCELLED: { label: 'Annulé', variant: 'destructive', icon: XCircle },
      COMPLETED: { label: 'Terminé', variant: 'outline', icon: CheckCircle },
    };
    const { label, variant, icon: Icon } = config[status] || { label: status, variant: 'outline', icon: AlertCircle };
    return (
      <Badge variant={variant} className="gap-1">
        <Icon size={12} />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestion des Billets</h1>
          <p className="text-gray-500">Suivez les ventes de billets pour vos événements</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques Globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Événements</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Billets Vendus</CardTitle>
            <Ticket className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{globalStats.soldTickets}</div>
            <p className="text-xs text-gray-500">sur {globalStats.totalTickets} billets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Billets Disponibles</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{globalStats.availableTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Taux de Vente</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {globalStats.totalTickets > 0 
                ? Math.round((globalStats.soldTickets / globalStats.totalTickets) * 100) 
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des événements avec stats tickets */}
      {events.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
            <p className="text-gray-500 mb-4">Créez votre premier événement pour commencer à vendre des billets</p>
            <Button onClick={() => navigate('/organizer/create-event')}>
              Créer un événement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket size={20} />
              Ventes par Événement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Événement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Vendus</TableHead>
                  <TableHead className="text-center">Disponibles</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const stats = ticketStats[event.id] || { total: 0, available: 0 };
                  const sold = getSoldCount(event.id);
                  const percentage = getSoldPercentage(event.id);
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.venue?.city || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(event.date || event.startTime)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(event.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-600">{sold}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-orange-600">{stats.available}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{stats.total}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={percentage} className="h-2" />
                          <span className="text-xs font-medium text-gray-600 w-10">
                            {percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="gap-1"
                        >
                          <Eye size={14} />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Légende */}
      <div className="flex gap-6 text-sm text-gray-500 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Vendus/Réservés</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Disponibles</span>
        </div>
      </div>
    </div>
  );
};

export default OrganizerTicketsPage;
