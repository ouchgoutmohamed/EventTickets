require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { userRoutes, ticketRoutes } = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Idempotency-Key'],
};

app.use(cors(corsOptions));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    services: {
      userService: config.services.userService,
      ticketInventoryService: config.services.ticketInventoryService,
    },
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'EventTickets API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      tickets: '/api/tickets',
    },
  });
});

// API Routes
app.use('/api', userRoutes);
app.use('/api/tickets', ticketRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;
