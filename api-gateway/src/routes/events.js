const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = express.Router();

/**
 * Routes catalogue d'événements (EventCatalogService)
 * Public: GET /events, GET /events/:id
 */
router.use(
  '/',
  createProxyMiddleware({
    target: config.services.eventCatalog,
    changeOrigin: true,
    pathRewrite: {
      '^/events': '/api/events', // Réécrire /events vers /api/events
    },
    onProxyReq: (proxyReq, req, res) => {
      // Transférer les headers d'authentification si présents
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
      }
      if (req.headers['x-user-role']) {
        proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
      }
      if (req.headers['x-user-email']) {
        proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
      }
    },
    onError: (err, req, res) => {
      console.error('Erreur proxy events:', err.message);
      res.status(503).json({
        success: false,
        message: 'Service catalogue d\'événements temporairement indisponible',
      });
    },
  })
);

module.exports = router;
