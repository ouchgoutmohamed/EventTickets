import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import ReservationList from '@/features/inventory/components/ReservationList';
import { getUserReservations } from '@/features/inventory/services/inventoryService';

const MyReservationsPage = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    if (!user || !user.id) {
      setError('Vous devez être connecté pour voir vos réservations');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserReservations(user.id);
      
      // La réponse peut être un objet avec une propriété reservations ou directement un tableau
      setReservations(data.reservations || data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des réservations:', err);
      const errorMessage = err.response?.data?.message || 'Impossible de récupérer vos réservations';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpdate = () => {
    // Rafraîchir la liste après une mise à jour
    fetchReservations();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Spinner size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Mes réservations
        </h1>
        <p className="text-gray-600">
          Gérez vos réservations et consultez vos tickets confirmés
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && (
        <ReservationList 
          reservations={reservations} 
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default MyReservationsPage;
