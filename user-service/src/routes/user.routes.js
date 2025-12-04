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
 * @swagger
 * /api/users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     description: Liste paginée de tous les utilisateurs (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  validatePagination,
  userController.getAllUsers
);

/**
 * @swagger
 * /api/users/organizer:
 *   post:
 *     summary: Créer un compte organisateur
 *     description: Crée un nouveau compte avec le rôle ORGANIZER (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Organisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
console.log('📝 Route POST /organizer enregistrée');
router.post(
  '/organizer',
  authenticate,
  isAdmin,
  userController.createOrganizer
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     description: Retourne les détails d'un utilisateur spécifique (soi-même ou Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticate,
  validateUserId,
  isSelfOrAdmin,
  userController.getUserById
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Mettre à jour son propre profil
 *     description: Permet à un utilisateur authentifié de modifier ses informations personnelles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  '/profile',
  authenticate,
  validateProfileUpdate,
  userController.updateUser
);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Changer son mot de passe
 *     description: Permet à un utilisateur de modifier son mot de passe
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe modifié avec succès"
 *       400:
 *         description: Mot de passe actuel incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
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
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Suppression définitive d'un compte utilisateur (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur supprimé avec succès"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateUserId,
  userController.deleteUser
);

module.exports = router;
