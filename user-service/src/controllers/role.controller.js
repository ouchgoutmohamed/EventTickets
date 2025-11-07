
const { roleService } = require('../services');
const { successResponse, errorResponse } = require('../utils/response.util');

/**
 * Contrôleur pour récupérer tous les rôles
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();

    return successResponse(
      res,
      200,
      'Rôles récupérés avec succès',
      { roles }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour récupérer un rôle par ID
 */
const getRoleById = async (req, res, next) => {
  try {
    const roleId = parseInt(req.params.id);

    const role = await roleService.getRoleById(roleId);

    return successResponse(
      res,
      200,
      'Rôle récupéré avec succès',
      { role }
    );
  } catch (error) {
    if (error.message === 'Rôle non trouvé') {
      return errorResponse(res, 404, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour créer un nouveau rôle
 */
const createRole = async (req, res, next) => {
  try {
    const { nom, description, permissions } = req.body;

    const role = await roleService.createRole({ nom, description, permissions });

    return successResponse(
      res,
      201,
      'Rôle créé avec succès',
      { role }
    );
  } catch (error) {
    if (error.message.includes('existe déjà')) {
      return errorResponse(res, 409, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur pour mettre à jour un rôle
 */
const updateRole = async (req, res, next) => {
  try {
    const roleId = parseInt(req.params.id);
    const { description, permissions } = req.body;

    const role = await roleService.updateRole(roleId, { description, permissions });

    return successResponse(
      res,
      200,
      'Rôle mis à jour avec succès',
      { role }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour supprimer un rôle
 */
const deleteRole = async (req, res, next) => {
  try {
    const roleId = parseInt(req.params.id);

    const result = await roleService.deleteRole(roleId);

    return successResponse(
      res,
      200,
      result.message
    );
  } catch (error) {
    if (error.message.includes('Impossible de supprimer')) {
      return errorResponse(res, 400, error.message);
    }
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
