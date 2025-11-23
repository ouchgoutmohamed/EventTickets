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
  pathRewrite: function (path, req) {
    const newPath = '/api/auth' + path;
    console.log(`[PathRewrite Auth] baseUrl=${req.baseUrl}, path=${path} -> ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${config.services.userService}${proxyReq.path}`);
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
  pathRewrite: function (path, req) {
    const newPath = '/api/users' + path;
    console.log(`[PathRewrite Users] baseUrl=${req.baseUrl}, path=${path} -> ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${config.services.userService}${proxyReq.path}`);
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
  pathRewrite: function (path, req) {
    // req.baseUrl is /api when coming through the /api mounting
    // path is / after /roles is stripped
    // We need to reconstruct /api/roles + remaining path
    const newPath = '/api/roles' + path;
    console.log(`[PathRewrite Roles] baseUrl=${req.baseUrl}, path=${path} -> ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${config.services.userService}${proxyReq.path}`);
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
