const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/authMiddleware');
const { loggingMiddleware } = require('./middleware/loggingMiddleware');
const {
  authRoutes,
  usersRoutes,
  eventsRoutes,
  inventoryRoutes,
  paymentsRoutes,
} = require('./routes');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Middlewares globaux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan logging pour les requêtes HTTP
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Custom logging middleware
app.use(loggingMiddleware);

// CORS Configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (config.cors.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', config.cors.origin[0]);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', config.cors.credentials);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0',
  });
});

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway running...',
    service: 'SIBE - API Gateway',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      events: '/events',
      inventory: '/inventory',
      payments: '/payments',
    },
  });
});

// Routes publiques (sans authentification)
app.use('/auth', authRoutes);
app.use('/events', eventsRoutes);

// Route publique: disponibilité des tickets (sans authentification)
app.get('/inventory/availability/:eventId', optionalAuthMiddleware, inventoryRoutes);

// Routes protégées (avec authentification) pour le reste des endpoints inventory
app.use('/inventory', authMiddleware, inventoryRoutes);

// Routes protégées (avec authentification)
app.use('/users', authMiddleware, usersRoutes);
app.use('/payments', authMiddleware, paymentsRoutes);

// Middleware de gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path,
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
