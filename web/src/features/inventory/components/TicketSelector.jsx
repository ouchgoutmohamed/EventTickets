import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

/**
 * Composant pour sélectionner la quantité de tickets
 * @param {Object} ticket - Les détails du ticket (id, name, price, quantity)
 * @param {number} selectedQuantity - La quantité actuellement sélectionnée
 * @param {Function} onQuantityChange - Callback appelé lors du changement de quantité
 * @param {number} maxPerReservation - Quantité maximale par réservation (défaut: 10)
 */
const TicketSelector = ({ 
  ticket, 
  selectedQuantity = 0, 
  onQuantityChange,
  maxPerReservation = 10 
}) => {
  const [error, setError] = useState(null);

  const handleIncrease = () => {
    setError(null);
    
    // Validation : quantité maximale par réservation
    if (selectedQuantity >= maxPerReservation) {
      setError(`Maximum ${maxPerReservation} tickets par réservation`);
      return;
    }

    // Validation : stock disponible
    if (selectedQuantity >= ticket.quantity) {
      setError('Stock insuffisant');
      return;
    }

    onQuantityChange(selectedQuantity + 1);
  };

  const handleDecrease = () => {
    setError(null);
    if (selectedQuantity > 0) {
      onQuantityChange(selectedQuantity - 1);
    }
  };

  const calculatePrice = () => {
    return (ticket.price * selectedQuantity).toFixed(2);
  };

  const isStockEmpty = ticket.quantity <= 0;
  const isMaxReached = selectedQuantity >= maxPerReservation || selectedQuantity >= ticket.quantity;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center p-3 border rounded-lg hover:border-green-200 transition-colors bg-gray-50/50">
        <div className="flex-1">
          <div className="font-bold text-gray-800">{ticket.name}</div>
          <div className="text-sm text-green-700 font-medium">{ticket.price} MAD</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {ticket.quantity > 0 ? `${ticket.quantity} restants` : 'Épuisé'}
          </div>
        </div>

        {/* Contrôles de quantité */}
        <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-full border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-full hover:bg-gray-100 disabled:opacity-30"
            onClick={handleDecrease}
            disabled={selectedQuantity === 0 || isStockEmpty}
          >
            <Minus size={14} />
          </Button>

          <span className="w-6 text-center font-bold text-sm">{selectedQuantity}</span>

          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-full hover:bg-gray-100 disabled:opacity-30"
            onClick={handleIncrease}
            disabled={isStockEmpty || isMaxReached}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Affichage du sous-total si quantité > 0 */}
      {selectedQuantity > 0 && (
        <div className="text-right text-sm text-gray-600 px-3">
          Sous-total: <span className="font-bold text-gray-900">{calculatePrice()} MAD</span>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2 text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TicketSelector;
