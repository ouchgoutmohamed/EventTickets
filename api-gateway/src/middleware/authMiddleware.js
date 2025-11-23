const jwt = require('jsonwebtoken');
const config = require('../config');

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

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant',
      });
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      const message = error.name === 'TokenExpiredError' 
        ? 'Token expiré' 
        : error.name === 'JsonWebTokenError'
        ? 'Token invalide'
        : 'Erreur lors de la vérification du token';
      
      return res.status(401).json({
        success: false,
        message,
      });
    }

    // Attacher les informations de l'utilisateur à la requête
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Ajouter les headers pour les microservices
    req.headers['x-user-id'] = req.user.id;
    req.headers['x-user-role'] = req.user.role || 'USER';
    if (req.user.email) {
      req.headers['x-user-email'] = req.user.email;
    }

    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Erreur lors de l\'authentification',
    });
  }
};

/**
 * Middleware optionnel d'authentification
 * Attache les informations de l'utilisateur si le token est présent et valide
 * Mais ne bloque pas si le token est absent
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      // En cas d'erreur, on continue sans utilisateur
      return next();
    }

    // Attacher les informations de l'utilisateur à la requête
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Ajouter les headers pour les microservices
    req.headers['x-user-id'] = req.user.id;
    req.headers['x-user-role'] = req.user.role || 'USER';
    if (req.user.email) {
      req.headers['x-user-email'] = req.user.email;
    }

    next();
  } catch (error) {
    console.error('Erreur dans optionalAuthMiddleware:', error);
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
