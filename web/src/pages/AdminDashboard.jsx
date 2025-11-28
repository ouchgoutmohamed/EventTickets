import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, UserCheck, Shield, TicketCheck } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import userService from '@/features/auth/services/userService';
import { getAllEvents } from '@/features/catalog/services/eventService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    activeOrganizers: 0,
    ticketsSold: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Récupérer le nombre total d'utilisateurs
      const usersResponse = await userService.getAllUsers(1, 1);
      const totalUsers = usersResponse.data?.pagination?.totalItems || 0;
      
      // Récupérer le nombre total d'événements
      const eventsData = await getAllEvents();
      const totalEvents = Array.isArray(eventsData) ? eventsData.length : 0;
      
      // Calculer les organisateurs actifs (utilisateurs avec rôle organisateur)
      const allUsersResponse = await userService.getAllUsers(1, 1000);
      const allUsers = allUsersResponse.data?.items || [];
      const activeOrganizers = allUsers.filter(u => 
        u.role?.nom?.toUpperCase().includes('ORGANISATEUR') || 
        u.role?.nom?.toUpperCase().includes('ORGANIZER')
      ).length;
      
      // Calculer le total des tickets (somme de tous les tickets des événements)
      let totalTickets = 0;
      if (Array.isArray(eventsData)) {
        eventsData.forEach(event => {
          if (event.tickets && Array.isArray(event.tickets)) {
            event.tickets.forEach(ticket => {
              totalTickets += ticket.quantity || 0;
            });
          }
        });
      }
      
      // Estimer le revenu (prix moyen * tickets)
      let estimatedRevenue = 0;
      if (Array.isArray(eventsData)) {
        eventsData.forEach(event => {
          if (event.tickets && Array.isArray(event.tickets)) {
            event.tickets.forEach(ticket => {
              estimatedRevenue += (ticket.price || 0) * (ticket.quantity || 0);
            });
          }
        });
      }
      
      setStats({
        totalUsers,
        totalEvents,
        totalRevenue: estimatedRevenue,
        activeOrganizers,
        ticketsSold: totalTickets,
        pendingApprovals: 0 // À implémenter plus tard
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      showError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12.5% ce mois'
    },
    {
      title: 'Événements Actifs',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+8 nouveaux'
    },
    {
      title: 'Revenu Total',
      value: `${stats.totalRevenue.toLocaleString()} MAD`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+23% vs mois dernier'
    },
    {
      title: 'Organisateurs Actifs',
      value: stats.activeOrganizers,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '3 nouveaux ce mois'
    },
    {
      title: 'Billets Vendus',
      value: stats.ticketsSold.toLocaleString(),
      icon: TicketCheck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      trend: 'Cette année'
    },
    {
      title: 'En Attente',
      value: stats.pendingApprovals,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'Approbations requises'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 border-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard Administrateur
        </h1>
        <p className="mt-2 text-gray-500">
          Bienvenue, {user?.prenom} {user?.nom}. Voici un aperçu de la plateforme.
        </p>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="transition-shadow duration-200 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <p className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
