require('dotenv').config();
const express = require('express');
const { authRoutes, userRoutes, roleRoutes } = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Middlewares globaux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'User Service running...', 
    service: 'SIBE - Service Utilisateur',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
    },
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'user-service',
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Middleware de gestion des routes non trouvées
app.use(notFound);

// Middleware de gestion des erreurs
app.use(errorHandler);

module.exports = app;
