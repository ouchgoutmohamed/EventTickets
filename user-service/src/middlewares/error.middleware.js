const { errorResponse } = require('../utils/response.util');

/**
 * Middleware de gestion des erreurs globales
 */
const errorHandler = (err, req, res, next) => {
  console.error('Erreur:', err);

  // Erreur de validation Prisma
  if (err.name === 'PrismaClientValidationError') {
    return errorResponse(res, 400, 'Erreur de validation des données');
  }

  // Erreur de contrainte unique Prisma
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'champ';
    return errorResponse(res, 409, `Ce ${field} est déjà utilisé`);
  }

  // Erreur de relation Prisma
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Ressource non trouvée');
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Token invalide');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expiré');
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';

  return errorResponse(res, statusCode, message);
};

/**
 * Middleware pour les routes non trouvées
 */
const notFound = (req, res) => {
  return errorResponse(res, 404, `Route non trouvée: ${req.method} ${req.url}`);
};

module.exports = {
  errorHandler,
  notFound,
};
