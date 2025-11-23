import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import ReservationTimer from '@/features/inventory/components/ReservationTimer';
import { useReservation } from '@/features/inventory/hooks/useReservation';
import { useToast } from '@/context/ToastContext';

const PaymentPage = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, release, loading } = useReservation();
  const { error: showError } = useToast();

  // Récupérer les détails de la réservation depuis l'état de navigation
  const reservationDetails = location.state?.reservation;

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Si on n'a pas les détails de la réservation, rediriger
    if (!reservationId) {
      showError('Réservation introuvable');
      navigate('/');
    }
  }, [reservationId, navigate, showError]);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      await confirm(reservationId);
      // Redirection vers la page de mes réservations après succès
      navigate('/my-reservations', { 
        state: { message: 'Paiement confirmé avec succès !' }
      });
    } catch (err) {
      console.error('Erreur lors de la confirmation du paiement:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await release(reservationId);
      navigate('/', { 
        state: { message: 'Réservation annulée' }
      });
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
    }
  };

  const handleExpiration = () => {
    showError('Votre réservation a expiré. Les tickets ont été libérés.');
  };

  if (!reservationDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center h-64">
          <Spinner size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Bouton Retour */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="pl-0 gap-2 text-gray-500 hover:text-gray-900" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> Retour
        </Button>
      </div>

      {/* Timer de réservation */}
      {reservationDetails.holdExpiresAt && (
        <div className="mb-6">
          <ReservationTimer
            expiresAt={reservationDetails.holdExpiresAt}
            onExpire={handleExpiration}
            redirectPath="/"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: Récapitulatif */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={24} />
                Paiement sécurisé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Paiement 100% sécurisé. Vos informations sont protégées.
                </AlertDescription>
              </Alert>

              {/* Formulaire de paiement simplifié */}
              <div className="space-y-4 py-4">
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-gray-600 mb-4">
                    Formulaire de paiement
                  </p>
                  <p className="text-sm text-gray-500">
                    Intégration du service de paiement en cours...
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmPayment}
                  disabled={loading || isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
                >
                  {isProcessing ? (
                    <>
                      <Spinner size={20} className="mr-2" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer le paiement'
                  )}
                </Button>
              </div>

              <Button
                onClick={handleCancelReservation}
                disabled={loading || isProcessing}
                variant="outline"
                className="w-full"
              >
                Annuler la réservation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite: Résumé de la commande */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {reservationDetails.eventTitle || 'Événement'}
                </h3>
                {reservationDetails.eventDate && (
                  <p className="text-sm text-gray-600">
                    {new Date(reservationDetails.eventDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantité</span>
                  <span className="font-medium">{reservationDetails.quantity} ticket(s)</span>
                </div>
                
                {reservationDetails.unitPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prix unitaire</span>
                    <span className="font-medium">{reservationDetails.unitPrice} MAD</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-green-600">
                  {(() => {
                    const total = reservationDetails.totalPrice || 
                                  (reservationDetails.quantity * (reservationDetails.unitPrice || 0));
                    return total;
                  })()} MAD
                </span>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2">
                Réservation #{reservationId}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
