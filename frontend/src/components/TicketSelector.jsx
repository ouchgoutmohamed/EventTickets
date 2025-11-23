

export default function TicketSelector({ price, quantity, onQuantityChange }) {
  const totalPrice = parseFloat((price || '').toString().replace(/[^0-9.]/g, '')) * quantity || price;

  return (
    <div className="ticket-selector space-y-3">
      <div className="price-display flex justify-between items-center">
        <span className="text-sm text-gray-600">Price:</span>
        <span className="text-sm font-medium text-gray-900">{price}</span>
      </div>

      <div className="ticket-price text-sm text-gray-700">1x Ticket(s)</div>

      <div className="quantity-selector inline-flex items-center gap-3">
        <button 
          className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-lg"
          onClick={() => onQuantityChange(-1)}
        >
          −
        </button>
        <span className="px-3">{quantity}</span>
        <button 
          className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-lg"
          onClick={() => onQuantityChange(1)}
        >
          +
        </button>
      </div>

      <div className="total-price flex justify-between items-center">
        <span className="text-sm font-semibold">TOTAL:</span>
        <span className="text-sm font-semibold text-indigo-600">{typeof totalPrice === 'number' ? `${totalPrice.toFixed(2)}` : totalPrice}</span>
      </div>
    </div>
  );
}
