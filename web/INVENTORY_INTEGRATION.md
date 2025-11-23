# Inventory Frontend Integration Guide

## Overview

This document describes the frontend integration of the Ticket Inventory Service with the API Gateway. The implementation provides a complete ticket reservation workflow including availability tracking, reservation management, and payment processing.

## Architecture

```
Frontend (React) → API Gateway (Express) → TicketInventoryService (Spring Boot)
     :3000              :3000                      :8082
```

## Features Implemented

### 1. Service Layer (`/features/inventory/services/inventoryService.js`)

Five core API functions:

- **`getAvailability(eventId)`** - INT-019
  - Fetches real-time ticket availability
  - Returns: `{ eventId, total, available }`

- **`reserveTickets({ eventId, userId, quantity })`** - INT-016
  - Creates a 15-minute reservation hold
  - Returns: `{ reservationId, status: "PENDING", holdExpiresAt }`

- **`confirmReservation(reservationId)`** - INT-017
  - Confirms a pending reservation
  - Returns: `{ reservationId, status: "CONFIRMED" }`

- **`releaseReservation(reservationId)`** - INT-018
  - Cancels/releases a reservation
  - Returns: `{ reservationId, status: "CANCELED" }`

- **`getUserReservations(userId)`** - INT-020
  - Fetches all user reservations
  - Returns: `{ reservations: Array }`

### 2. Custom Hooks

#### `useAvailability(eventId, options)`
- Manages ticket availability state
- Supports auto-polling (default: 30s interval)
- Returns: `{ availability, loading, error, refetch }`

**Example:**
```javascript
const { availability, loading } = useAvailability(eventId, { 
  enablePolling: true,
  pollingInterval: 30000 
});
```

#### `useReservation()`
- Handles reservation operations
- Integrates with toast notifications
- Auto-authenticates with user context
- Returns: `{ reserve, confirm, release, loading }`

**Example:**
```javascript
const { reserve, loading } = useReservation();

const handleReserve = async () => {
  const response = await reserve(eventId, quantity);
  navigate(`/payment/${response.reservationId}`);
};
```

### 3. Reusable Components

#### `<AvailabilityBadge />`
Displays real-time ticket availability with color-coded states:
- **Green**: > 25% available
- **Yellow**: 10-25% available  
- **Orange**: < 10% available (shows exact count)
- **Red**: Sold out

**Props:**
```javascript
<AvailabilityBadge 
  eventId={123}
  enablePolling={true}
  pollingInterval={30000}
/>
```

#### `<TicketSelector />`
Ticket quantity selector with validation:
- Max 10 tickets per reservation
- Stock availability validation
- Real-time price calculation
- Error handling

**Props:**
```javascript
<TicketSelector
  ticket={{ id, name, price, quantity }}
  selectedQuantity={0}
  onQuantityChange={(qty) => setQuantity(qty)}
  maxPerReservation={10}
/>
```

#### `<ReservationTimer />`
15-minute countdown timer with alerts:
- Visual alerts at < 5 min and < 1 min
- Auto-expiration handling
- Automatic redirect on expiry

**Props:**
```javascript
<ReservationTimer
  expiresAt="2025-11-23T22:00:00Z"
  onExpire={() => handleExpiration()}
  redirectPath="/"
/>
```

#### `<ReservationList />`
Complete reservation management UI:
- Tabbed filtering by status
- Confirm/Cancel actions
- Status badges
- Event details display

**Props:**
```javascript
<ReservationList
  reservations={[...]}
  onUpdate={() => fetchReservations()}
/>
```

### 4. Pages

#### `EventDetailsPage` (Updated)
- Integrated with real inventory API
- Live availability display with polling
- Reservation flow with authentication check
- Quantity validation (max 10 tickets)
- Redirects to payment page on successful reservation

**Flow:**
1. User selects tickets
2. Clicks "Réserver maintenant"
3. System creates reservation via API
4. Redirects to `/payment/{reservationId}` with details

#### `PaymentPage` (New)
- Displays reservation timer
- Shows order summary
- Payment form placeholder (integration pending)
- Confirm/Cancel reservation actions

**Route:** `/payment/:reservationId`

#### `MyReservationsPage` (New)
- Lists all user reservations
- Filters by status (All, Pending, Confirmed, Canceled, Expired)
- Manage reservations (confirm/cancel)
- Integrated with ReservationList component

**Route:** `/my-reservations`

### 5. Utilities

#### `reservationStatus.js`
Constants and display configurations for reservation statuses:

```javascript
import { RESERVATION_STATUS, getReservationStatusConfig } from '@/utils/reservationStatus';

const config = getReservationStatusConfig('PENDING');
// Returns: { label, variant, icon, badgeColor }
```

**Statuses:**
- `PENDING` - Yellow, Clock icon
- `CONFIRMED` - Green, Shield icon
- `CANCELED` - Gray, X icon
- `EXPIRED` - Red, AlertTriangle icon

## Configuration

### Environment Variables

Create a `.env` file in `/web`:

```env
VITE_API_GATEWAY_URL=http://localhost:3000
VITE_API_USER_URL=http://localhost:3001/api
VITE_API_CATALOG_URL=http://localhost:8080/events
```

### API Gateway Routes

The API Gateway proxies inventory requests:

```
/inventory/availability/{eventId} → /tickets/availability/{eventId}
/inventory/reserve                → /tickets/reserve
/inventory/confirm                → /tickets/confirm
/inventory/release                → /tickets/release
/inventory/user/{userId}          → /tickets/user/{userId}
```

All inventory routes are **protected** and require authentication.

## Error Handling

The implementation includes comprehensive error handling:

### Client-Side Errors
- **401 Unauthorized**: Auto-redirect to login (handled by axios interceptor)
- **404 Not Found**: Event or reservation not found
- **409 Conflict**: Stock insufficient or reservation expired
- **503 Service Unavailable**: Backend service down

### User Feedback
All errors display toast notifications with appropriate messages:
```javascript
// Success
success('Réservation créée avec succès !');

// Error
error('Stock insuffisant ou réservation déjà existante');
```

## Validation Rules

1. **Ticket Quantity**
   - Minimum: 1 ticket
   - Maximum: 10 tickets per reservation
   - Cannot exceed available stock

2. **Reservation Timer**
   - Duration: 15 minutes
   - Auto-cancellation on expiry
   - Visual alerts at 5 min and 1 min remaining

3. **Authentication**
   - Must be logged in to reserve tickets
   - Redirects to login if unauthenticated
   - Preserves return path

## Usage Examples

### Basic Reservation Flow

```javascript
import { useReservation } from '@/features/inventory/hooks/useReservation';
import { useNavigate } from 'react-router-dom';

function EventPage({ eventId }) {
  const { reserve, loading } = useReservation();
  const navigate = useNavigate();

  const handleReserve = async (quantity) => {
    try {
      const response = await reserve(eventId, quantity);
      
      navigate(`/payment/${response.reservationId}`, {
        state: {
          reservation: {
            reservationId: response.reservationId,
            holdExpiresAt: response.holdExpiresAt,
            quantity,
            // ... other details
          }
        }
      });
    } catch (err) {
      // Error already handled by hook
    }
  };

  return (
    <button onClick={() => handleReserve(2)} disabled={loading}>
      Réserver 2 tickets
    </button>
  );
}
```

### Availability Polling

```javascript
import { useAvailability } from '@/features/inventory/hooks/useAvailability';

function AvailabilityDisplay({ eventId }) {
  const { availability, loading, error } = useAvailability(eventId, {
    enablePolling: true,
    pollingInterval: 30000 // Poll every 30 seconds
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {availability.available} / {availability.total} disponibles
    </div>
  );
}
```

## Building and Testing

### Development
```bash
cd web
npm run dev
```

### Production Build
```bash
cd web
npm run build
```

### Linting
```bash
cd web
npm run lint
```

## Next Steps

1. **Payment Integration**
   - Integrate PaymentService
   - Complete payment form in PaymentPage
   - Handle payment confirmation/failure

2. **Testing**
   - Add unit tests for hooks
   - Add component tests
   - Add E2E tests for reservation flow

3. **Enhancements**
   - Add reservation history export
   - Email notifications on reservation status changes
   - QR code generation for confirmed tickets

## API Reference

See [TicketController.java](../../TicketInventoryService/src/main/java/com/acme/tickets/controller/TicketController.java) for complete API documentation.

## Troubleshooting

### "Service d'inventaire temporairement indisponible"
- Check if TicketInventoryService is running on port 8082
- Verify API Gateway configuration in `api-gateway/src/config.js`
- Check CORS settings

### Timer not counting down
- Verify `holdExpiresAt` is in ISO 8601 format
- Check browser console for errors
- Ensure ReservationTimer component receives valid date

### Availability not updating
- Check if polling is enabled: `enablePolling: true`
- Verify network tab for API calls
- Check API Gateway proxy configuration

## Support

For issues or questions, please refer to the main project README or open an issue on GitHub.
