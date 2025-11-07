const { body, param, query, validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/response.util');

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }
  
  next();
};

/**
 * Validation pour l'inscription
 */
const validateRegistration = [
  body('nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('prenom')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body()
    .custom((value, { req }) => {
      const password = req.body.motDePasse || req.body.password;
      if (!password) {
        throw new Error('Le mot de passe est requis');
      }
      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }
      if (!/[a-z]/.test(password)) {
        throw new Error('Le mot de passe doit contenir au moins une lettre minuscule');
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error('Le mot de passe doit contenir au moins une lettre majuscule');
      }
      if (!/[0-9]/.test(password)) {
        throw new Error('Le mot de passe doit contenir au moins un chiffre');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        throw new Error('Le mot de passe doit contenir au moins un caractère spécial');
      }
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Validation pour la connexion
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body()
    .custom((value, { req }) => {
      if (!req.body.motDePasse && !req.body.password) {
        throw new Error('Le mot de passe est requis');
      }
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Validation pour la mise à jour du profil
 */
const validateProfileUpdate = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  
  body('adresse')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('L\'adresse ne doit pas dépasser 255 caractères'),
  
  body('ville')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ville ne doit pas dépasser 100 caractères'),
  
  body('codePostal')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne doit pas dépasser 20 caractères'),
  
  body('pays')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le pays ne doit pas dépasser 100 caractères'),
  
  body('telephone')
    .optional()
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage('Numéro de téléphone invalide'),
  
  body('dateNaissance')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  
  handleValidationErrors,
];

/**
 * Validation pour le changement de mot de passe
 */
const validatePasswordChange = [
  body()
    .custom((value, { req }) => {
      const oldPassword = req.body.ancienMotDePasse || req.body.oldPassword;
      if (!oldPassword) {
        throw new Error('L\'ancien mot de passe est requis');
      }
      return true;
    }),
  
  body()
    .custom((value, { req }) => {
      const newPassword = req.body.nouveauMotDePasse || req.body.newPassword;
      if (!newPassword) {
        throw new Error('Le nouveau mot de passe est requis');
      }
      if (newPassword.length < 8) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      }
      if (!/[a-z]/.test(newPassword)) {
        throw new Error('Le nouveau mot de passe doit contenir au moins une lettre minuscule');
      }
      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Le nouveau mot de passe doit contenir au moins une lettre majuscule');
      }
      if (!/[0-9]/.test(newPassword)) {
        throw new Error('Le nouveau mot de passe doit contenir au moins un chiffre');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        throw new Error('Le nouveau mot de passe doit contenir au moins un caractère spécial');
      }
      
      // Vérifier la confirmation si elle existe
      const confirmPassword = req.body.confirmationMotDePasse || req.body.confirmPassword;
      if (confirmPassword && confirmPassword !== newPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Validation pour l'ID utilisateur
 */
const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
  
  handleValidationErrors,
];

/**
 * Validation pour l'attribution de rôle
 */
const validateRoleAssignment = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
  
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('ID de rôle invalide'),
  
  handleValidationErrors,
];

/**
 * Validation pour la pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un nombre entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateUserId,
  validateRoleAssignment,
  validatePagination,
};
