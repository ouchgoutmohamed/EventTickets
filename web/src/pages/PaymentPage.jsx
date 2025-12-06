import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Ticket, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import ReservationTimer from '@/features/inventory/components/ReservationTimer';
import { useReservation } from '@/features/inventory/hooks/useReservation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { executePayment } from '@/features/payments/services/paymentService';

const PaymentPage = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, release, loading } = useReservation();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

  // Récupérer les détails de la réservation depuis l'état de navigation
  const reservationDetails = location.state?.reservation;

  const [isProcessing, setIsProcessing] = useState(false);

  // État du formulaire de paiement
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Si on n'a pas les détails de la réservation, rediriger
    if (!reservationId) {
      showError('Réservation introuvable');
      navigate('/');
    }
  }, [reservationId, navigate, showError]);

  // Gestion des changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatage automatique du numéro de carte (XXXX XXXX XXXX XXXX)
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    }
    // Formatage automatique de la date d'expiration (MM/YY)
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 5);
    }
    // CVV: max 4 chiffres
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setPaymentForm(prev => ({ ...prev, [name]: formattedValue }));
    // Effacer l'erreur du champ modifié
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    // Validation du numéro de carte (16 chiffres)
    const cardNumberClean = paymentForm.cardNumber.replace(/\s/g, '');
    if (!cardNumberClean || cardNumberClean.length !== 16) {
      errors.cardNumber = 'Numéro de carte invalide (16 chiffres requis)';
    }
    
    // Validation du nom du titulaire
    if (!paymentForm.cardHolder.trim()) {
      errors.cardHolder = 'Nom du titulaire requis';
    }
    
    // Validation de la date d'expiration
    if (!paymentForm.expiryDate || paymentForm.expiryDate.length !== 5) {
      errors.expiryDate = 'Date d\'expiration invalide (MM/YY)';
    } else {
      const [month, year] = paymentForm.expiryDate.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        errors.expiryDate = 'Carte expirée';
      }
    }
    
    // Validation du CVV (3-4 chiffres)
    if (!paymentForm.cvv || paymentForm.cvv.length < 3) {
      errors.cvv = 'CVV invalide (3-4 chiffres)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmPayment = async () => {
    if (!user || !user.id) {
      showError('Vous devez être connecté pour effectuer un paiement');
      return;
    }

    // Valider le formulaire avant de procéder
    if (!validateForm()) {
      showError('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Exécuter le paiement via le PaymentService
      // Cela génère automatiquement un ticket électronique
      const totalAmount = reservationDetails?.totalPrice || 
                         (reservationDetails?.quantity * (reservationDetails?.unitPrice || 0)) ||
                         100;
      
      const paymentResult = await executePayment({
        user_id: user.id,
        event_id: reservationDetails?.eventId || 1,
        ticket_id: reservationDetails?.ticketId || 1,
        reservation_id: reservationId,
        amount: totalAmount,
        currency: 'MAD',
        method: 'Credit Card',
      });

      console.log('✅ Paiement réussi:', paymentResult);

      // 2. Confirmer la réservation dans l'inventaire
      await confirm(reservationId);

      showSuccess('Paiement confirmé ! Votre billet a été généré.');

      // 3. Redirection vers la page "Mes Billets"
      navigate('/my-tickets', { 
        state: { 
          message: 'Paiement confirmé avec succès ! Votre billet est disponible.',
          fromPayment: true,
          paymentId: paymentResult?.id
        }
      });
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      showError(err.response?.data?.message || 'Erreur lors du paiement');
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

              {/* Formulaire de paiement */}
              <div className="space-y-4 py-4">
                {/* Numéro de carte */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Numéro de carte
                  </Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentForm.cardNumber}
                    onChange={handleInputChange}
                    className={formErrors.cardNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.cardNumber && (
                    <p className="text-sm text-red-500">{formErrors.cardNumber}</p>
                  )}
                </div>

                {/* Nom du titulaire */}
                <div className="space-y-2">
                  <Label htmlFor="cardHolder">Nom du titulaire</Label>
                  <Input
                    id="cardHolder"
                    name="cardHolder"
                    type="text"
                    placeholder="JEAN DUPONT"
                    value={paymentForm.cardHolder}
                    onChange={handleInputChange}
                    className={formErrors.cardHolder ? 'border-red-500' : ''}
                  />
                  {formErrors.cardHolder && (
                    <p className="text-sm text-red-500">{formErrors.cardHolder}</p>
                  )}
                </div>

                {/* Date d'expiration et CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Date d'expiration</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="text"
                      placeholder="MM/YY"
                      value={paymentForm.expiryDate}
                      onChange={handleInputChange}
                      className={formErrors.expiryDate ? 'border-red-500' : ''}
                    />
                    {formErrors.expiryDate && (
                      <p className="text-sm text-red-500">{formErrors.expiryDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      type="password"
                      placeholder="123"
                      value={paymentForm.cvv}
                      onChange={handleInputChange}
                      className={formErrors.cvv ? 'border-red-500' : ''}
                    />
                    {formErrors.cvv && (
                      <p className="text-sm text-red-500">{formErrors.cvv}</p>
                    )}
                  </div>
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
