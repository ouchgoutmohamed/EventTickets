# EventTickets Frontend

React + Vite frontend application for the EventTickets platform. This application provides a unified interface to interact with all backend microservices including User Service, Event Catalog Service, Payment & Notification Service, and Ticket Inventory Service.

## Features

- **User Management**: Authentication, profile management, user administration
- **Ticket Inventory**: Real-time ticket availability, reservations, and booking management
- **Event Catalog**: Browse and discover events (placeholder - in development)
- **Payments**: Payment processing and notifications (placeholder - in development)

## Tech Stack

- **React 19.2** - UI library
- **Vite 7.2** - Build tool
- **React Router 7.9** - Routing
- **React Bootstrap 2.9** - UI components
- **Axios 1.13** - HTTP client
- **React Icons 5.5** - Icon library

## Environment Configuration

Create a `.env` file in the frontend directory with the following variables:

```env
# User Service / API Gateway URL
VITE_API_BASE_URL=http://localhost:3001/api

# Ticket Inventory Service URL
VITE_TICKET_INVENTORY_API_URL=http://localhost:8082

# Event Catalog Service URL (optional)
# VITE_EVENT_CATALOG_API_URL=http://localhost:8081

# Payment and Notification Service URL (optional)
# VITE_PAYMENT_API_URL=http://localhost:8083
```

See `.env.example` for a template.

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server (default port: 5173)
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── api/                  # API service modules
│   │   ├── axiosConfig.js           # Main axios instance (User Service)
│   │   ├── authService.js           # Authentication API
│   │   ├── userService.js           # User management API
│   │   ├── roleService.js           # Role management API
│   │   └── ticketInventoryService.js # Ticket Inventory API
│   ├── components/           # Reusable React components
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── ...
│   ├── context/              # React context providers
│   │   ├── AuthContext.jsx          # Authentication state
│   │   └── ToastContext.jsx         # Toast notifications
│   ├── pages/                # Page components (routes)
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── TicketInventory.jsx      # Ticket management page
│   │   └── ...
│   ├── App.jsx               # Main app component with routing
│   └── main.jsx              # Application entry point
├── public/                   # Static assets
├── .env.example              # Environment variables template
└── package.json
```

## API Integration

The frontend integrates with multiple backend services:

### User Service
- **Base URL**: `VITE_API_BASE_URL` (default: http://localhost:3001/api)
- **Features**: Authentication, user management, roles
- **API Client**: `src/api/userService.js`, `src/api/authService.js`

### Ticket Inventory Service
- **Base URL**: `VITE_TICKET_INVENTORY_API_URL` (default: http://localhost:8082)
- **Features**: Ticket availability, reservations, confirmations
- **API Client**: `src/api/ticketInventoryService.js`
- **Endpoints**:
  - `GET /tickets/availability/{eventId}` - Get ticket availability
  - `POST /tickets/reserve` - Reserve tickets
  - `POST /tickets/confirm` - Confirm reservation
  - `POST /tickets/release` - Cancel reservation
  - `GET /tickets/user/{userId}` - Get user reservations

## Key Features

### Ticket Inventory Management

The Ticket Inventory page (`/tickets`) provides:

1. **Availability Display**
   - Real-time ticket counts (total, available, reserved)
   - Event selection by ID

2. **Ticket Reservation**
   - Quantity selection (1-10 tickets)
   - Idempotency support to prevent duplicate reservations
   - Automatic expiration handling (15 minutes)

3. **Reservation Management**
   - View all user reservations with status badges
   - Confirm pending reservations
   - Cancel unwanted reservations
   - Status tracking (PENDING, CONFIRMED, CANCELED, EXPIRED)

### Authentication Flow

- Token-based authentication with JWT
- Automatic token refresh on 401 responses
- Protected routes requiring authentication
- Role-based access control for admin features

## Development Notes

### ESLint Configuration

This template uses Vite's minimal ESLint setup. For production applications, consider:

- Adding TypeScript with type-aware lint rules
- Configuring additional ESLint plugins for React best practices
- See the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for TypeScript integration

### React Compiler

The React Compiler is not enabled by default due to performance considerations. To enable it, see [React Compiler documentation](https://react.dev/learn/react-compiler/installation).

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend services have CORS properly configured for your frontend URL.

### Authentication Issues
- Check that tokens are being stored in localStorage
- Verify the `VITE_API_BASE_URL` points to the correct User Service
- Check browser console for detailed error messages

### Ticket Inventory Not Loading
- Verify `VITE_TICKET_INVENTORY_API_URL` is correctly configured
- Ensure the TicketInventoryService backend is running on port 8082
- Check network tab for API request/response details

## Contributing

When adding new features:

1. Follow the existing pattern for API services (see `ticketInventoryService.js`)
2. Create dedicated axios instances for new backend services
3. Use React Context for global state management
4. Add proper error handling and loading states
5. Ensure components are responsive and accessible

## License

Apache 2.0
