const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = express.Router();

/**
 * Routes tickets (paymentAndNotificationService)
 * Ces routes permettent aux utilisateurs de :
 * - Voir leurs tickets après un paiement réussi
 * - Afficher/imprimer un ticket avec QR code
 * - Valider un ticket (pour les organisateurs)
 */

// Route pour récupérer les tickets de l'utilisateur connecté
router.use(
  '/',
  createProxyMiddleware({
    target: config.services.payment,
    changeOrigin: true,
    pathRewrite: {
      '^/tickets': '/api/tickets', // Réécrire /tickets vers /api/tickets
    },
    onProxyReq: (proxyReq, req, res) => {
      // Transférer les headers d'authentification
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
      }
      if (req.headers['x-user-role']) {
        proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
      }
      if (req.headers['x-user-email']) {
        proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
      }
      
      // Re-stream body si déjà parsé par express.json() (pour POST /validate)
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      
      // Log pour debug
      console.log(`[Tickets Proxy] ${req.method} ${req.path} -> ${config.services.payment}/api/tickets${req.path.replace('/tickets', '')}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Pour les routes d'impression, s'assurer que le Content-Type est correct
      if (req.path.includes('/print')) {
        // Laisser le backend définir le Content-Type (HTML)
      }
    },
    onError: (err, req, res) => {
      console.error('Erreur proxy tickets:', err.message);
      res.status(503).json({
        success: false,
        message: 'Service de tickets temporairement indisponible',
      });
    },
  })
);

module.exports = router;
