const { PrismaClient } = require('../generated/prisma');
const { hashPassword, comparePassword } = require('../utils/password.util');

const prisma = new PrismaClient();

/**
 * Service pour récupérer tous les utilisateurs avec pagination
 */
const getAllUsers = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;

  const where = {};

  // Filtres optionnels
  if (filters.etat) {
    where.etat = filters.etat;
  }

  if (filters.roleId) {
    where.roleId = parseInt(filters.roleId);
  }

  if (filters.search) {
    where.OR = [
      { nom: { contains: filters.search } },
      { prenom: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        role: true,
        profil: {
          select: {
            telephone: true,
            ville: true,
            pays: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Retirer les mots de passe
  const usersWithoutPassword = users.map(({ motDePasse, ...user }) => user);

  return {
    users: usersWithoutPassword,
    total,
    page,
    limit,
  };
};

/**
 * Service pour récupérer un utilisateur par ID
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      profil: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  const { motDePasse, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

/**
 * Service pour mettre à jour un utilisateur
 */
const updateUser = async (userId, updateData) => {
  const { nom, prenom, adresse, ville, codePostal, pays, telephone, dateNaissance, preferences } = updateData;

  // Séparer les données utilisateur et profil
  const userData = {};
  const profilData = {};

  if (nom !== undefined) userData.nom = nom;
  if (prenom !== undefined) userData.prenom = prenom;

  if (adresse !== undefined) profilData.adresse = adresse;
  if (ville !== undefined) profilData.ville = ville;
  if (codePostal !== undefined) profilData.codePostal = codePostal;
  if (pays !== undefined) profilData.pays = pays;
  if (telephone !== undefined) profilData.telephone = telephone;
  if (dateNaissance !== undefined) profilData.dateNaissance = new Date(dateNaissance);
  if (preferences !== undefined) profilData.preferences = preferences;

  // Mettre à jour l'utilisateur
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
      ...(Object.keys(profilData).length > 0 && {
        profil: {
          update: profilData,
        },
      }),
    },
    include: {
      role: true,
      profil: true,
    },
  });

  const { motDePasse, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

/**
 * Service pour changer le mot de passe
 */
const changePassword = async (userId, ancienMotDePasse, nouveauMotDePasse) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Vérifier l'ancien mot de passe
  const isPasswordValid = await comparePassword(ancienMotDePasse, user.motDePasse);

  if (!isPasswordValid) {
    throw new Error('Ancien mot de passe incorrect');
  }

  // Hacher le nouveau mot de passe
  const nouveauMotDePasseHash = await hashPassword(nouveauMotDePasse);

  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { id: userId },
    data: {
      motDePasse: nouveauMotDePasseHash,
    },
  });

  return { message: 'Mot de passe modifié avec succès' };
};

/**
 * Service pour désactiver un compte utilisateur
 */
const disableUser = async (userId, adminId) => {
  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Empêcher la désactivation de son propre compte
  if (userId === adminId) {
    throw new Error('Vous ne pouvez pas désactiver votre propre compte');
  }

  // Désactiver le compte
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      etat: 'inactif',
    },
    include: {
      role: true,
    },
  });

  const { motDePasse, ...userWithoutPassword } = updatedUser;

  return userWithoutPassword;
};

/**
 * Service pour activer un compte utilisateur
 */
const enableUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      etat: 'actif',
    },
    include: {
      role: true,
    },
  });

  const { motDePasse, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

/**
 * Service pour attribuer un rôle à un utilisateur
 */
const assignRole = async (userId, roleId) => {
  // Vérifier que le rôle existe
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new Error('Rôle non trouvé');
  }

  // Attribuer le rôle
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      roleId,
    },
    include: {
      role: true,
      profil: true,
    },
  });

  const { motDePasse, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

/**
 * Service pour récupérer l'historique des connexions
 */
const getConnectionHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.historiqueConnexion.findMany({
      where: { utilisateurId: userId },
      skip,
      take: limit,
      orderBy: {
        dateConnexion: 'desc',
      },
    }),
    prisma.historiqueConnexion.count({
      where: { utilisateurId: userId },
    }),
  ]);

  return {
    history,
    total,
    page,
    limit,
  };
};

/**
 * Service pour supprimer un utilisateur (soft delete)
 */
const deleteUser = async (userId, adminId) => {
  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Empêcher la suppression de son propre compte
  if (userId === adminId) {
    throw new Error('Vous ne pouvez pas supprimer votre propre compte');
  }

  // Marquer comme supprimé (soft delete)
  await prisma.user.update({
    where: { id: userId },
    data: {
      etat: 'supprimé',
    },
  });

  return { message: 'Utilisateur supprimé avec succès' };
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
  deleteUser,
};
