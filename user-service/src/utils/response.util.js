/**
 * Formater une réponse de succès
 * @param {Object} res - Objet response Express
 * @param {Number} statusCode - Code HTTP
 * @param {String} message - Message de succès
 * @param {Object} data - Données à retourner
 */
const successResponse = (res, statusCode = 200, message = 'Succès', data = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Formater une réponse d'erreur
 * @param {Object} res - Objet response Express
 * @param {Number} statusCode - Code HTTP
 * @param {String} message - Message d'erreur
 * @param {Object} errors - Détails des erreurs
 */
const errorResponse = (res, statusCode = 500, message = 'Erreur serveur', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Formater une réponse de validation échouée
 * @param {Object} res - Objet response Express
 * @param {Array} errors - Tableau des erreurs de validation
 */
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 422, 'Erreur de validation', errors);
};

/**
 * Formater une réponse d'authentification échouée
 * @param {Object} res - Objet response Express
 * @param {String} message - Message d'erreur
 */
const unauthorizedResponse = (res, message = 'Non autorisé') => {
  return errorResponse(res, 401, message);
};

/**
 * Formater une réponse d'accès interdit
 * @param {Object} res - Objet response Express
 * @param {String} message - Message d'erreur
 */
const forbiddenResponse = (res, message = 'Accès interdit') => {
  return errorResponse(res, 403, message);
};

/**
 * Formater une réponse de ressource non trouvée
 * @param {Object} res - Objet response Express
 * @param {String} message - Message d'erreur
 */
const notFoundResponse = (res, message = 'Ressource non trouvée') => {
  return errorResponse(res, 404, message);
};

/**
 * Formater une réponse de conflit
 * @param {Object} res - Objet response Express
 * @param {String} message - Message d'erreur
 */
const conflictResponse = (res, message = 'Conflit') => {
  return errorResponse(res, 409, message);
};

/**
 * Formater une réponse paginée
 * @param {Object} res - Objet response Express
 * @param {Array} data - Données à paginer
 * @param {Number} page - Page actuelle
 * @param {Number} limit - Limite par page
 * @param {Number} total - Total des éléments
 */
const paginatedResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(res, 200, 'Succès', {
    items: data,
    pagination: {
      currentPage: page,
      totalPages,
      itemsPerPage: limit,
      totalItems: total,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  paginatedResponse,
};
