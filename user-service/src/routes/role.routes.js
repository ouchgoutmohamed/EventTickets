const express = require('express');
const { roleController } = require('../controllers');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const router = express.Router();

/**
 * @route   GET /api/roles
 * @desc    Récupérer tous les rôles
 * @access  Privé - Authentifié
 */
router.get(
  '/',
  authenticate,
  roleController.getAllRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Récupérer un rôle par ID
 * @access  Privé - Admin uniquement
 */
router.get(
  '/:id',
  authenticate,
  isAdmin,
  roleController.getRoleById
);

/**
 * @route   POST /api/roles
 * @desc    Créer un nouveau rôle
 * @access  Privé - Admin uniquement
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('nom')
      .trim()
      .notEmpty()
      .withMessage('Le nom du rôle est requis')
      .isLength({ min: 2, max: 50 })
      .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('La description ne doit pas dépasser 255 caractères'),
    handleValidationErrors,
  ],
  roleController.createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Mettre à jour un rôle
 * @access  Privé - Admin uniquement
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  [
    body('description')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('La description ne doit pas dépasser 255 caractères'),
    handleValidationErrors,
  ],
  roleController.updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Supprimer un rôle
 * @access  Privé - Admin uniquement
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  roleController.deleteRole
);

module.exports = router;
