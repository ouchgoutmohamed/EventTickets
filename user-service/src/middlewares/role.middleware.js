const { forbiddenResponse } = require('../utils/response.util');

/**
 * Middleware pour vérifier si l'utilisateur a un rôle spécifique
 * @param  {...String} allowedRoles - Rôles autorisés
 */
const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentification requise');
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return forbiddenResponse(
        res,
        `Accès interdit. Rôles requis: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est administrateur
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return forbiddenResponse(res, 'Authentification requise');
  }

  if (req.user.role !== 'administrateur') {
    return forbiddenResponse(res, 'Accès réservé aux administrateurs');
  }

  next();
};

/**
 * Middleware pour vérifier si l'utilisateur est organisateur ou admin
 */
const isOrganisateur = (req, res, next) => {
  if (!req.user) {
    return forbiddenResponse(res, 'Authentification requise');
  }

  if (!['organisateur', 'administrateur'].includes(req.user.role)) {
    return forbiddenResponse(res, 'Accès réservé aux organisateurs et administrateurs');
  }

  next();
};

/**
 * Middleware pour vérifier si l'utilisateur a une permission spécifique
 * Note: This middleware is deprecated as permissions system has been removed.
 * Use role-based middleware (isAdmin, isOrganisateur) instead.
 * @param {String} permission - Permission requise
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    console.warn(`hasPermission('${permission}') middleware is deprecated. Use role-based middleware instead.`);
    
    if (!req.user) {
      return forbiddenResponse(res, 'Authentification requise');
    }

    // Since permissions are removed, default to admin-only access
    if (req.user.role !== 'administrateur') {
      return forbiddenResponse(res, 'Accès réservé aux administrateurs');
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur peut accéder à ses propres ressources
 * ou est administrateur
 */
const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return forbiddenResponse(res, 'Authentification requise');
  }

  const targetUserId = parseInt(req.params.id || req.params.userId);
  
  if (req.user.id !== targetUserId && req.user.role !== 'administrateur') {
    return forbiddenResponse(res, 'Vous ne pouvez accéder qu\'à vos propres ressources');
  }

  next();
};

module.exports = {
  hasRole,
  isAdmin,
  isOrganisateur,
  hasPermission,
  isSelfOrAdmin,
};
