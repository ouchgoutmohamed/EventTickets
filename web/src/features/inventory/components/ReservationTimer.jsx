import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

/**
 * Composant de compte à rebours pour une réservation
 * @param {string} expiresAt - Date d'expiration au format ISO
 * @param {Function} onExpire - Callback appelé à l'expiration
 * @param {string} redirectPath - Chemin de redirection à l'expiration (optionnel)
 */
const ReservationTimer = ({ expiresAt, onExpire, redirectPath = '/' }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setHasExpired(true);
        setTimeLeft({ minutes: 0, seconds: 0 });
        
        // Appeler le callback d'expiration
        if (onExpire) {
          onExpire();
        }

        // Redirection automatique après 3 secondes
        setTimeout(() => {
          navigate(redirectPath);
        }, 3000);

        return null;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return { minutes, seconds, totalSeconds: Math.floor(difference / 1000) };
    };

    // Mise à jour chaque seconde
    const timer = setInterval(() => {
      const time = calculateTimeLeft();
      setTimeLeft(time);
    }, 1000);

    // Calcul initial lors du premier rendu
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [expiresAt, onExpire, navigate, redirectPath]);

  if (!timeLeft) {
    return null;
  }

  const { minutes, seconds, totalSeconds } = timeLeft;

  // Déterminer le variant de l'alerte selon le temps restant
  const getAlertVariant = () => {
    if (hasExpired) return 'destructive';
    if (totalSeconds <= 60) return 'destructive'; // < 1 min
    if (totalSeconds <= 300) return 'warning'; // < 5 min
    return 'default';
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Alert variant={getAlertVariant()} className="border-l-4">
      <div className="flex items-center gap-3">
        {hasExpired ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Clock className="h-5 w-5" />
        )}
        
        <div className="flex-1">
          <AlertTitle className="font-bold">
            {hasExpired ? 'Réservation expirée' : 'Temps restant'}
          </AlertTitle>
          <AlertDescription className="mt-1">
            {hasExpired ? (
              <span>Votre réservation a expiré. Redirection en cours...</span>
            ) : (
              <>
                <span className="font-mono text-lg font-bold">
                  {formatTime(minutes, seconds)}
                </span>
                <span className="ml-2 text-sm">
                  {totalSeconds <= 60 
                    ? 'Dépêchez-vous !' 
                    : totalSeconds <= 300 
                      ? 'Plus beaucoup de temps...' 
                      : 'Confirmez votre réservation'}
                </span>
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default ReservationTimer;
