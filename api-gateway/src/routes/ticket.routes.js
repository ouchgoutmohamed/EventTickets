const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = express.Router();

/**
 * Ticket Inventory Service Routes
 * Proxy all /api/tickets/* routes to TicketInventoryService
 */

router.use('/', createProxyMiddleware({
  target: config.services.ticketInventoryService,
  changeOrigin: true,
  pathRewrite: function (path, req) {
    const newPath = '/tickets' + path;
    console.log(`[PathRewrite] ${path} -> ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> ${config.services.ticketInventoryService}${proxyReq.path}`);
    
    // Forward the Authorization header to the backend service
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Forward the Idempotency-Key header if present
    if (req.headers['idempotency-key']) {
      proxyReq.setHeader('Idempotency-Key', req.headers['idempotency-key']);
    }
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error - Ticket Inventory Service]', err.message);
    res.status(500).json({
      success: false,
      message: 'Ticket inventory service unavailable',
      error: err.message,
    });
  },
}));

module.exports = router;
