const express = require('express');
const { userController } = require('../controllers');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin, isSelfOrAdmin } = require('../middlewares/role.middleware');
const {
  validateProfileUpdate,
  validatePasswordChange,
  validateUserId,
  validateRoleAssignment,
  validatePagination,
} = require('../middlewares/validation.middleware');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Récupérer tous les utilisateurs (avec pagination)
 * @access  Privé - Admin uniquement
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  validatePagination,
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Privé - Soi-même ou Admin
 */
router.get(
  '/:id',
  authenticate,
  validateUserId,
  isSelfOrAdmin,
  userController.getUserById
);

/**
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour son propre profil
 * @access  Privé
 */
router.put(
  '/profile',
  authenticate,
  validateProfileUpdate,
  userController.updateUser
);

/**
 * @route   PUT /api/users/password
 * @desc    Changer son mot de passe
 * @access  Privé
 */
router.put(
  '/password',
  authenticate,
  validatePasswordChange,
  userController.changePassword
);

/**
 * @route   GET /api/users/history
 * @desc    Récupérer l'historique des connexions de l'utilisateur connecté
 * @access  Privé
 */
router.get(
  '/history/me',
  authenticate,
  validatePagination,
  userController.getConnectionHistory
);

/**
 * @route   GET /api/users/:id/history
 * @desc    Récupérer l'historique des connexions d'un utilisateur spécifique
 * @access  Privé - Admin uniquement
 */
router.get(
  '/:id/history',
  authenticate,
  isAdmin,
  validateUserId,
  validatePagination,
  userController.getUserConnectionHistory
);

/**
 * @route   PUT /api/users/:id/disable
 * @desc    Désactiver un compte utilisateur
 * @access  Privé - Admin uniquement
 */
router.put(
  '/:id/disable',
  authenticate,
  isAdmin,
  validateUserId,
  userController.disableUser
);

/**
 * @route   PUT /api/users/:id/enable
 * @desc    Activer un compte utilisateur
 * @access  Privé - Admin uniquement
 */
router.put(
  '/:id/enable',
  authenticate,
  isAdmin,
  validateUserId,
  userController.enableUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Attribuer un rôle à un utilisateur
 * @access  Privé - Admin uniquement
 */
router.put(
  '/:id/role',
  authenticate,
  isAdmin,
  validateRoleAssignment,
  userController.assignRole
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Privé - Admin uniquement
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateUserId,
  userController.deleteUser
);

module.exports = router;
