const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = express.Router();

/**
 * Routes d'authentification (user-service)
 * Public: /auth/login, /auth/register
 * Protected: /auth/profile, /auth/logout
 */
router.use(
  '/',
  createProxyMiddleware({
    target: config.services.userService,
    changeOrigin: true,
    pathRewrite: {
      '^/auth': '/api/auth', // Réécrire /auth vers /api/auth
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
    },
    onError: (err, req, res) => {
      console.error('Erreur proxy auth:', err.message);
      res.status(503).json({
        success: false,
        message: 'Service d\'authentification temporairement indisponible',
      });
    },
  })
);

module.exports = router;
