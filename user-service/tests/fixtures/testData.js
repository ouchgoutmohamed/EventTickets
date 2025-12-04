const bcrypt = require('bcrypt');

/**
 * Données de test réutilisables
 */

// Utilisateurs de test
const testUsers = {
  admin: {
    id: 1,
    nom: 'Admin',
    prenom: 'Test',
    email: 'admin@test.com',
    motDePasse: '$2b$10$XqQz.PqwV8Rqz1QzqQzqQeMHqQzqQzqQzqQzqQzqQzqQzqQzqQzqQu', // hashed "password123"
    etat: 'actif',
    roleId: 1,
    role: {
      id: 1,
      nom: 'Administrateur',
      description: 'Administrateur du système',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  user: {
    id: 2,
    nom: 'User',
    prenom: 'Test',
    email: 'user@test.com',
    motDePasse: '$2b$10$XqQz.PqwV8Rqz1QzqQzqQeMHqQzqQzqQzqQzqQzqQzqQzqQzqQzqQu', // hashed "password123"
    etat: 'actif',
    roleId: 2,
    role: {
      id: 2,
      nom: 'Utilisateur',
      description: 'Utilisateur standard',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  inactive: {
    id: 3,
    nom: 'Inactive',
    prenom: 'User',
    email: 'inactive@test.com',
    motDePasse: '$2b$10$XqQz.PqwV8Rqz1QzqQzqQeMHqQzqQzqQzqQzqQzqQzqQzqQzqQzqQu',
    etat: 'inactif',
    roleId: 2,
    role: {
      id: 2,
      nom: 'Utilisateur',
      description: 'Utilisateur standard',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Rôles de test
const testRoles = {
  admin: {
    id: 1,
    nom: 'Administrateur',
    description: 'Administrateur du système',
    permissions: ['read', 'write', 'delete', 'manage_users'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  user: {
    id: 2,
    nom: 'Utilisateur',
    description: 'Utilisateur standard',
    permissions: ['read'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  organizer: {
    id: 3,
    nom: 'Organisateur',
    description: 'Organisateur d\'événements',
    permissions: ['read', 'write', 'create_events'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Données d'inscription
const validRegistrationData = {
  nom: 'Nouveau',
  prenom: 'Utilisateur',
  email: 'nouveau@test.com',
  motDePasse: 'SecurePass123!',
  roleNom: 'Utilisateur',
};

// Données de connexion
const validLoginData = {
  email: 'user@test.com',
  motDePasse: 'password123',
};

/**
 * Fonctions utilitaires pour les tests
 */

// Générer un hash de mot de passe
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Créer un utilisateur de test
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    nom: 'Test',
    prenom: 'User',
    email: `test${Date.now()}@test.com`,
    motDePasse: await hashPassword('password123'),
    etat: 'actif',
    roleId: 2,
  };

  return { ...defaultUser, ...overrides };
};

// Nettoyer les données sensibles d'un utilisateur
const sanitizeUser = (user) => {
  const { motDePasse, ...sanitized } = user;
  return sanitized;
};

module.exports = {
  testUsers,
  testRoles,
  validRegistrationData,
  validLoginData,
  hashPassword,
  createTestUser,
  sanitizeUser,
};
