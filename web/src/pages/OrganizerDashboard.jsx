import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getOrganizerStats, getCategoryStats } from '@/api/stats';

const OrganizerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [organizerData, categoriesData] = await Promise.all([
          getOrganizerStats(),
          getCategoryStats()
        ]);
        setStats(organizerData);
        setCategoryStats(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError('Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500">Chargement...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="w-16 h-8 mb-2 bg-gray-200 rounded"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Vue d'ensemble de vos événements</p>
      </div>

      {/* Cartes Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Événements Total</CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.activeEvents || 0} actifs • {stats?.upcomingEvents || 0} à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Capacité Totale</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCapacity?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500">
              Moyenne: {Math.round(stats?.averageCapacityPerEvent || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Ce Mois</CardTitle>
            <Activity className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.eventsThisMonth || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.growthRate >= 0 ? '+' : ''}{stats?.growthRate?.toFixed(1) || 0}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Mois Prochain</CardTitle>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.eventsNextMonth || 0}</div>
            <p className="text-xs text-gray-500">événements planifiés</p>
          </CardContent>
        </Card>
      </div>

      {/* Événement Populaire */}
      {stats?.mostPopularEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Événement le Plus Populaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{stats.mostPopularEvent.title}</span>
                <span className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                  {stats.mostPopularEvent.category}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Capacité: {stats.mostPopularEvent.capacity}</span>
                <span>•</span>
                <span>Date: {new Date(stats.mostPopularEvent.date).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catégories */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Événements par Catégorie</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryStats.map((cat) => (
            <Card key={cat.category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{cat.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Événements</span>
                    <span className="text-sm font-semibold">{cat.eventCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Capacité</span>
                    <span className="text-sm font-semibold">{cat.totalCapacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Part</span>
                    <span className="text-sm font-bold text-blue-600">
                      {cat.percentageOfTotal.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Statuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">État des Événements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 text-center rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{stats?.activeEvents || 0}</div>
              <div className="text-sm text-gray-600">Actifs</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{stats?.upcomingEvents || 0}</div>
              <div className="text-sm text-gray-600">À venir</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-gray-600">{stats?.pastEvents || 0}</div>
              <div className="text-sm text-gray-600">Passés</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{stats?.cancelledEvents || 0}</div>
              <div className="text-sm text-gray-600">Annulés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      {/* <Alert>
        <AlertDescription className="text-sm">
          💡 <strong>Note:</strong> Les statistiques de vente de tickets sont gérées par TicketInventoryService.
        </AlertDescription>
      </Alert> */}
    </div>
  );
};

export default OrganizerDashboard;