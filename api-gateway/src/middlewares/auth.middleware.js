const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to verify JWT token
 * Extracts and validates the Bearer token from Authorization header
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // Attach decoded user info to request
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

/**
 * Optional auth middleware - allows request to pass even without token
 * But still validates and attaches user if token is present
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch (error) {
    console.log('[Auth Middleware] Optional auth - token invalid:', error.message);
  }

  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
};
