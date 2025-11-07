const jwt = require('jsonwebtoken');

/**
 * Générer un token JWT
 * @param {Object} payload - Données à encoder dans le token
 * @param {String} expiresIn - Durée de validité (ex: '24h', '7d')
 * @returns {String} Token JWT
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      issuer: 'sibe-user-service',
    });
  } catch (error) {
    throw new Error('Erreur lors de la génération du token: ' + error.message);
  }
};

/**
 * Générer un refresh token
 * @param {Object} payload - Données à encoder dans le token
 * @returns {String} Refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'sibe-user-service',
      }
    );
  } catch (error) {
    throw new Error('Erreur lors de la génération du refresh token: ' + error.message);
  }
};

/**
 * Vérifier un token JWT
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    }
    throw new Error('Erreur lors de la vérification du token: ' + error.message);
  }
};

/**
 * Vérifier un refresh token
 * @param {String} token - Refresh token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh token invalide');
    }
    throw new Error('Erreur lors de la vérification du refresh token: ' + error.message);
  }
};

/**
 * Décoder un token sans vérification
 * @param {String} token - Token à décoder
 * @returns {Object} Payload décodé
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Erreur lors du décodage du token: ' + error.message);
  }
};

/**
 * Extraire le token du header Authorization
 * @param {String} authHeader - Header Authorization
 * @returns {String|null} Token extrait ou null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
};
