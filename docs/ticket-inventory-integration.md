# TicketInventoryService Frontend Integration Guide

## Overview

This document explains how the TicketInventoryService is integrated with the frontend through the API Gateway.

## Architecture

```
Frontend (React/Vite)
    ↓ HTTP Requests via VITE_API_BASE_URL
API Gateway (http://localhost:3000/api)
    ↓ Proxies to backend services
    ├─→ user-service (http://localhost:3001)
    └─→ TicketInventoryService (http://localhost:8082)
```

## Key Changes Made

### 1. API Gateway Created

A new `api-gateway` service was created to serve as the single entry point for all backend services:

- **Location:** `/api-gateway`
- **Port:** 3000
- **Technology:** Node.js, Express, http-proxy-middleware
- **Purpose:** Route all frontend requests to appropriate backend services

### 2. Frontend API Layer Updated

The frontend's `ticketInventoryService.js` was refactored to use the API Gateway:

**Before:**
```javascript
// Direct call to TicketInventoryService
const TICKET_INVENTORY_API_URL = 'http://localhost:8082';
const ticketInventoryAxios = axios.create({
  baseURL: TICKET_INVENTORY_API_URL,
});
```

**After:**
```javascript
// Call through API Gateway using shared axiosInstance
import axiosInstance from './axiosConfig';

const ticketInventoryService = {
  getAvailability: async (eventId) => {
    const response = await axiosInstance.get(`/tickets/availability/${eventId}`);
    return response.data;
  },
  // ... other methods
};
```

### 3. Environment Variables Simplified

**Before:**
```env
VITE_API_BASE_URL=http://localhost:3001/api  # user-service
VITE_TICKET_INVENTORY_API_URL=http://localhost:8082  # direct call
```

**After:**
```env
VITE_API_BASE_URL=http://localhost:3000/api  # API Gateway only
```

## API Routes

All ticket-related routes are prefixed with `/api/tickets` and proxied to TicketInventoryService:

| Frontend Route | API Gateway Route | Backend Service | Backend Path |
|----------------|-------------------|-----------------|--------------|
| `/tickets/availability/:eventId` | `GET /api/tickets/availability/:eventId` | TicketInventoryService | `/tickets/availability/:eventId` |
| `/tickets/reserve` | `POST /api/tickets/reserve` | TicketInventoryService | `/tickets/reserve` |
| `/tickets/confirm` | `POST /api/tickets/confirm` | TicketInventoryService | `/tickets/confirm` |
| `/tickets/release` | `POST /api/tickets/release` | TicketInventoryService | `/tickets/release` |
| `/tickets/user/:userId` | `GET /api/tickets/user/:userId` | TicketInventoryService | `/tickets/user/:userId` |

## Setup Instructions

### 1. API Gateway Setup

```bash
cd api-gateway
npm install
cp .env.example .env
# Edit .env to configure service URLs and JWT_SECRET
npm run dev
```

**Important:** The `JWT_SECRET` in `api-gateway/.env` must match the one in `user-service/.env`.

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env should contain: VITE_API_BASE_URL=http://localhost:3000/api
npm run dev
```

### 3. Backend Services Setup

Start services in this order:

1. MySQL database
2. user-service (port 3001)
3. TicketInventoryService (port 8082)
4. api-gateway (port 3000)
5. frontend (port 5173)

## Authentication Flow

1. User logs in through frontend → API Gateway → user-service
2. JWT token is returned and stored in localStorage
3. Frontend attaches token to all requests via Authorization header
4. API Gateway receives requests with token
5. API Gateway proxies to backend services (preserving Authorization header)
6. Backend services validate token independently

## Benefits of This Architecture

1. **Single Entry Point:** Frontend only needs to know about one URL (API Gateway)
2. **Centralized CORS:** CORS is configured once in the API Gateway
3. **Service Discovery:** Frontend doesn't need to know about individual service locations
4. **Flexibility:** Backend services can be moved/scaled without frontend changes
5. **Consistent Auth:** All services benefit from centralized JWT validation
6. **Error Handling:** Centralized error handling and logging

## Troubleshooting

### Issue: 401 Unauthorized from Ticket Routes

**Cause:** JWT_SECRET mismatch between api-gateway and user-service

**Solution:** Ensure both services use the same JWT_SECRET in their .env files

### Issue: CORS Errors

**Cause:** Frontend origin not allowed in API Gateway CORS configuration

**Solution:** Check `CORS_ORIGIN` in `api-gateway/.env` matches frontend URL (default: http://localhost:5173)

### Issue: 500 Service Unavailable

**Cause:** Backend service is not running or URL is incorrect

**Solution:** 
1. Check that all backend services are running
2. Verify service URLs in `api-gateway/.env`
3. Check API Gateway logs for proxy errors

## Testing the Integration

### Manual Testing

1. Start all services (user-service, TicketInventoryService, api-gateway, frontend)
2. Navigate to http://localhost:5173
3. Login with valid credentials
4. Go to `/tickets` route
5. Test ticket operations:
   - View availability for an event
   - Reserve tickets
   - View reservations
   - Confirm/cancel reservations

### Verify API Gateway Proxy

```bash
# Test health check
curl http://localhost:3000/health

# Test ticket availability (replace :eventId with actual ID)
curl http://localhost:3000/api/tickets/availability/1

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/tickets/user/1
```

## Future Enhancements

1. **Add EventCatalogService routes** to API Gateway
2. **Add PaymentService routes** to API Gateway
3. **Implement rate limiting** in API Gateway
4. **Add request/response logging** middleware
5. **Implement circuit breaker** pattern for resilience
6. **Add health checks** for all backend services

## Files Modified/Created

### Created:
- `api-gateway/` - Complete API Gateway service
  - `src/app.js` - Express app configuration
  - `src/server.js` - Server startup
  - `src/config/index.js` - Configuration management
  - `src/middlewares/auth.middleware.js` - JWT validation
  - `src/middlewares/error.middleware.js` - Error handling
  - `src/routes/user.routes.js` - User service proxy
  - `src/routes/ticket.routes.js` - Ticket service proxy
  - `package.json` - Dependencies
  - `README.md` - API Gateway documentation
  - `.env.example` - Environment template

### Modified:
- `frontend/src/api/ticketInventoryService.js` - Refactored to use API Gateway
- `frontend/.env.example` - Simplified to single API_BASE_URL
- `README.md` - Updated with API Gateway information

## Notes

- All existing frontend functionality for user-service remains unchanged
- The TicketInventory UI component (`pages/TicketInventory.jsx`) did not need modification
- No breaking changes to existing user authentication or profile management
- The integration follows the same patterns as the existing user-service integration
