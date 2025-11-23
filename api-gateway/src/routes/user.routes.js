const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = express.Router();

/**
 * User Service Routes
 * Proxy all /api/auth/* and /api/users/* and /api/roles/* routes to user-service
 */

// Auth routes (public - no auth required for login/register)
router.use('/auth', createProxyMiddleware({
  target: config.services.userService,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth',
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} /api/auth${req.url} -> ${config.services.userService}/api/auth${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error - User Service]', err.message);
    res.status(500).json({
      success: false,
      message: 'User service unavailable',
      error: err.message,
    });
  },
}));

// User routes (protected - require auth)
router.use('/users', createProxyMiddleware({
  target: config.services.userService,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users',
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} /api/users${req.url} -> ${config.services.userService}/api/users${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error - User Service]', err.message);
    res.status(500).json({
      success: false,
      message: 'User service unavailable',
      error: err.message,
    });
  },
}));

// Role routes (protected - require auth)
router.use('/roles', createProxyMiddleware({
  target: config.services.userService,
  changeOrigin: true,
  pathRewrite: {
    '^/api/roles': '/api/roles',
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} /api/roles${req.url} -> ${config.services.userService}/api/roles${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error - User Service]', err.message);
    res.status(500).json({
      success: false,
      message: 'User service unavailable',
      error: err.message,
    });
  },
}));

module.exports = router;
