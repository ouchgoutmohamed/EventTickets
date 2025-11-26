import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Hash } from 'lucide-react';
import { getReservationStatusConfig, RESERVATION_STATUS } from '@/utils/reservationStatus';
import { useReservation } from '../hooks/useReservation';

/**
 * Composant pour afficher la liste des réservations d'un utilisateur
 * @param {Array} reservations - Liste des réservations
 * @param {Function} onUpdate - Callback appelé après confirmation/annulation
 */
const ReservationList = ({ reservations = [], onUpdate }) => {
  const [activeTab, setActiveTab] = useState('all');
  const { confirm, release, loading } = useReservation();

  // Filtrer les réservations selon l'onglet actif
  const filterReservations = (status) => {
    if (status === 'all') return reservations;
    return reservations.filter(r => r.status === status);
  };

  // Gérer la confirmation d'une réservation
  const handleConfirm = async (reservationId) => {
    try {
      await confirm(reservationId);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Erreur lors de la confirmation:', err);
    }
  };

  // Gérer l'annulation d'une réservation
  const handleCancel = async (reservationId) => {
    try {
      await release(reservationId);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
    }
  };

  // Compter les réservations par statut
  const counts = {
    all: reservations.length,
    pending: reservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length,
    confirmed: reservations.filter(r => r.status === RESERVATION_STATUS.CONFIRMED).length,
    canceled: reservations.filter(r => r.status === RESERVATION_STATUS.CANCELED).length,
    expired: reservations.filter(r => r.status === RESERVATION_STATUS.EXPIRED).length,
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Toutes ({counts.all})
          </TabsTrigger>
          <TabsTrigger value={RESERVATION_STATUS.PENDING}>
            En attente ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value={RESERVATION_STATUS.CONFIRMED}>
            Confirmées ({counts.confirmed})
          </TabsTrigger>
          <TabsTrigger value={RESERVATION_STATUS.CANCELED}>
            Annulées ({counts.canceled})
          </TabsTrigger>
          <TabsTrigger value={RESERVATION_STATUS.EXPIRED}>
            Expirées ({counts.expired})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ReservationCards
            reservations={reservations}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value={RESERVATION_STATUS.PENDING}>
          <ReservationCards
            reservations={filterReservations(RESERVATION_STATUS.PENDING)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value={RESERVATION_STATUS.CONFIRMED}>
          <ReservationCards
            reservations={filterReservations(RESERVATION_STATUS.CONFIRMED)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value={RESERVATION_STATUS.CANCELED}>
          <ReservationCards
            reservations={filterReservations(RESERVATION_STATUS.CANCELED)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value={RESERVATION_STATUS.EXPIRED}>
          <ReservationCards
            reservations={filterReservations(RESERVATION_STATUS.EXPIRED)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {reservations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune réservation trouvée</p>
        </div>
      )}
    </div>
  );
};

// Sous-composant pour afficher les cartes de réservations
const ReservationCards = ({ reservations, onConfirm, onCancel, loading }) => {
  if (!reservations || reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucune réservation dans cette catégorie</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map(reservation => (
        <ReservationCard
          key={reservation.reservationId}
          reservation={reservation}
          onConfirm={onConfirm}
          onCancel={onCancel}
          loading={loading}
        />
      ))}
    </div>
  );
};

// Composant pour une carte de réservation individuelle
const ReservationCard = ({ reservation, onConfirm, onCancel, loading }) => {
  const statusConfig = getReservationStatusConfig(reservation.status);
  const StatusIcon = statusConfig.icon;

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg text-gray-900">
                {reservation.eventTitle || 'Événement'}
              </h3>
              <Badge className={`${statusConfig.badgeColor} border`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Hash size={14} />
                <span>Réservation: {reservation.reservationId}</span>
              </div>
              
              {reservation.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{formatDate(reservation.eventDate)}</span>
                </div>
              )}

              {reservation.venue && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{reservation.venue}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600">Quantité</div>
            <div className="text-2xl font-bold text-gray-900">{reservation.quantity}</div>
            {reservation.totalPrice && (
              <div className="text-sm text-green-600 font-medium mt-1">
                {reservation.totalPrice} MAD
              </div>
            )}
          </div>
        </div>

        {/* Actions selon le statut */}
        {reservation.status === RESERVATION_STATUS.PENDING && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              onClick={() => onConfirm(reservation.reservationId)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              Confirmer
            </Button>
            <Button
              onClick={() => onCancel(reservation.reservationId)}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        )}

        {reservation.status === RESERVATION_STATUS.CONFIRMED && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => onCancel(reservation.reservationId)}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Annuler la réservation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationList;
