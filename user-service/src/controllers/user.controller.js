const { userService } = require('../services');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.util');

/**
 * Contrôleur pour récupérer tous les utilisateurs
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      etat: req.query.etat,
      roleId: req.query.roleId,
      search: req.query.search,
    };

    const result = await userService.getAllUsers(page, limit, filters);

    return paginatedResponse(
      res,
      result.users,
      result.page,
      result.limit,
      result.total
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour récupérer un utilisateur par ID
 */
const getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await userService.getUserById(userId);

    return successResponse(
      res,
      200,
      'Utilisateur récupéré avec succès',
      { user }
    );
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return errorResponse(res, 404, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour mettre à jour un utilisateur
 */
const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id; // Utilisateur connecté
    const updateData = req.body;

    const user = await userService.updateUser(userId, updateData);

    return successResponse(
      res,
      200,
      'Profil mis à jour avec succès',
      { user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour changer le mot de passe
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Accepter français ou anglais
    const ancienMotDePasse = req.body.ancienMotDePasse || req.body.oldPassword;
    const nouveauMotDePasse = req.body.nouveauMotDePasse || req.body.newPassword;

    const result = await userService.changePassword(
      userId,
      ancienMotDePasse,
      nouveauMotDePasse
    );

    return successResponse(
      res,
      200,
      result.message
    );
  } catch (error) {
    if (error.message === 'Ancien mot de passe incorrect') {
      return errorResponse(res, 400, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour désactiver un compte utilisateur
 */
const disableUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.user.id;

    const user = await userService.disableUser(userId, adminId);

    return successResponse(
      res,
      200,
      'Compte utilisateur désactivé avec succès',
      { user }
    );
  } catch (error) {
    if (error.message.includes('ne pouvez pas désactiver')) {
      return errorResponse(res, 400, error.message);
    }
    if (error.message === 'Utilisateur non trouvé') {
      return errorResponse(res, 404, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour activer un compte utilisateur
 */
const enableUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await userService.enableUser(userId);

    return successResponse(
      res,
      200,
      'Compte utilisateur activé avec succès',
      { user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour attribuer un rôle à un utilisateur
 */
const assignRole = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { roleId } = req.body;

    const user = await userService.assignRole(userId, roleId);

    return successResponse(
      res,
      200,
      'Rôle attribué avec succès',
      { user }
    );
  } catch (error) {
    if (error.message === 'Rôle non trouvé') {
      return errorResponse(res, 404, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour récupérer l'historique des connexions
 */
const getConnectionHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await userService.getConnectionHistory(userId, page, limit);

    return paginatedResponse(
      res,
      result.history,
      result.page,
      result.limit,
      result.total
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour récupérer l'historique d'un utilisateur spécifique (Admin)
 */
const getUserConnectionHistory = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await userService.getConnectionHistory(userId, page, limit);

    return paginatedResponse(
      res,
      result.history,
      result.page,
      result.limit,
      result.total
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour supprimer un utilisateur
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.user.id;

    const result = await userService.deleteUser(userId, adminId);

    return successResponse(
      res,
      200,
      result.message
    );
  } catch (error) {
    if (error.message.includes('ne pouvez pas supprimer')) {
      return errorResponse(res, 400, error.message);
    }
    if (error.message === 'Utilisateur non trouvé') {
      return errorResponse(res, 404, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour créer un compte organisateur (Admin uniquement)
 */
const createOrganizer = async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, ville, pays } = req.body;

    const result = await userService.createOrganizer({
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      ville,
      pays,
    });

    return successResponse(
      res,
      201,
      'Compte organisateur créé avec succès',
      result
    );
  } catch (error) {
    if (error.message === 'Un compte avec cet email existe déjà') {
      return errorResponse(res, 400, error.message);
    }
    if (error.message.includes('n\'existe pas')) {
      return errorResponse(res, 404, error.message);
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  disableUser,
  enableUser,
  assignRole,
  getConnectionHistory,
  getUserConnectionHistory,
  deleteUser,
  createOrganizer,
};
