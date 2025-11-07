const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

/**
 * Service pour récupérer tous les rôles
 */
const getAllRoles = async () => {
  const roles = await prisma.role.findMany({
    orderBy: {
      nom: 'asc',
    },
  });

  return roles;
};

/**
 * Service pour récupérer un rôle par ID
 */
const getRoleById = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new Error('Rôle non trouvé');
  }

  return role;
};

/**
 * Service pour créer un nouveau rôle
 */
const createRole = async (roleData) => {
  const { nom, description, permissions } = roleData;

  // Vérifier si le rôle existe déjà
  const existingRole = await prisma.role.findUnique({
    where: { nom },
  });

  if (existingRole) {
    throw new Error('Un rôle avec ce nom existe déjà');
  }

  const role = await prisma.role.create({
    data: {
      nom,
      description,
      permissions,
    },
  });

  return role;
};

/**
 * Service pour mettre à jour un rôle
 */
const updateRole = async (roleId, roleData) => {
  const { description, permissions } = roleData;

  const role = await prisma.role.update({
    where: { id: roleId },
    data: {
      description,
      permissions,
    },
  });

  return role;
};

/**
 * Service pour supprimer un rôle
 */
const deleteRole = async (roleId) => {
  // Vérifier qu'aucun utilisateur n'utilise ce rôle
  const usersWithRole = await prisma.user.count({
    where: { roleId },
  });

  if (usersWithRole > 0) {
    throw new Error(`Impossible de supprimer ce rôle: ${usersWithRole} utilisateur(s) l'utilisent encore`);
  }

  await prisma.role.delete({
    where: { id: roleId },
  });

  return { message: 'Rôle supprimé avec succès' };
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
