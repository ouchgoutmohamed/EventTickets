const { PrismaClient } = require('../generated/prisma');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { generateToken, generateRefreshToken } = require('../utils/jwt.util');
const { extractRequestInfo } = require('../utils/request.util');

const prisma = new PrismaClient();

/**
 * Service d'inscription d'un nouvel utilisateur
 */
const register = async (userData, req) => {
  const { nom, prenom, email, motDePasse, roleId, roleNom } = userData;

  // Déterminer le roleId (soit directement fourni, soit via roleNom, sinon défaut = 1)
  let finalRoleId = roleId || 1;
  
  if (roleNom && !roleId) {
    // Si roleNom est fourni mais pas roleId, chercher le rôle par son nom
    const role = await prisma.role.findUnique({
      where: { nom: roleNom },
    });
    
    if (!role) {
      throw new Error(`Le rôle "${roleNom}" n'existe pas`);
    }
    
    finalRoleId = role.id;
  }

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Un compte avec cet email existe déjà');
  }

  // Hacher le mot de passe
  const motDePasseHash = await hashPassword(motDePasse);

  // Créer l'utilisateur avec son profil
  const user = await prisma.user.create({
    data: {
      nom,
      prenom,
      email,
      motDePasse: motDePasseHash,
      roleId: finalRoleId,
      profil: {
        create: {},
      },
    },
    include: {
      role: true,
      profil: true,
    },
  });

  // Enregistrer la connexion initiale
  const requestInfo = extractRequestInfo(req);
  await prisma.historiqueConnexion.create({
    data: {
      utilisateurId: user.id,
      adresseIp: requestInfo.ip,
      navigateur: requestInfo.browser,
      systemeExploit: requestInfo.os,
      appareil: requestInfo.device,
      succesConnexion: true,
    },
  });

  // Générer les tokens avec les informations complètes pour les autres services
  const token = generateToken({ 
    userId: user.id, 
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.nom,
    organizerId: user.role.nom === 'organisateur' ? user.id : null
  });
  const refreshToken = generateRefreshToken({ 
    userId: user.id,
    roleId: user.roleId,
    organizerId: user.role.nom === 'organisateur' ? user.id : null
  });

  // Retourner les données (sans le mot de passe)
  const { motDePasse: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

/**
 * Service de connexion d'un utilisateur
 */
const login = async (email, motDePasse, req) => {
  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      profil: true,
    },
  });

  if (!user) {
    // Enregistrer la tentative de connexion échouée
    const requestInfo = extractRequestInfo(req);
    // Note: On ne peut pas enregistrer avec utilisateurId car l'utilisateur n'existe pas
    throw new Error('Email ou mot de passe incorrect');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await comparePassword(motDePasse, user.motDePasse);

  const requestInfo = extractRequestInfo(req);

  if (!isPasswordValid) {
    // Enregistrer la tentative de connexion échouée
    await prisma.historiqueConnexion.create({
      data: {
        utilisateurId: user.id,
        adresseIp: requestInfo.ip,
        navigateur: requestInfo.browser,
        systemeExploit: requestInfo.os,
        appareil: requestInfo.device,
        succesConnexion: false,
      },
    });
    
    throw new Error('Email ou mot de passe incorrect');
  }

  // Vérifier l'état du compte
  if (user.etat !== 'actif') {
    throw new Error('Votre compte est inactif ou suspendu. Veuillez contacter l\'administrateur.');
  }

  // Enregistrer la connexion réussie
  await prisma.historiqueConnexion.create({
    data: {
      utilisateurId: user.id,
      adresseIp: requestInfo.ip,
      navigateur: requestInfo.browser,
      systemeExploit: requestInfo.os,
      appareil: requestInfo.device,
      succesConnexion: true,
    },
  });

  // Générer les tokens avec les informations complètes pour les autres services
  const token = generateToken({ 
    userId: user.id, 
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.nom,
    organizerId: user.role.nom === 'organisateur' ? user.id : null
  });
  const refreshToken = generateRefreshToken({ 
    userId: user.id,
    roleId: user.roleId,
    organizerId: user.role.nom === 'organisateur' ? user.id : null
  });

  // Retourner les données (sans le mot de passe)
  const { motDePasse: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

/**
 * Service de rafraîchissement du token
 */
const refreshAccessToken = async (userId) => {
  // Vérifier que l'utilisateur existe
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

  if (user.etat !== 'actif') {
    throw new Error('Compte inactif');
  }

  // Générer un nouveau token d'accès avec les informations complètes
  const token = generateToken({ 
    userId: user.id, 
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.nom,
    organizerId: user.role.nom === 'organisateur' ? user.id : null
  });

  return { token };
};

/**
 * Service de récupération du profil utilisateur
 */
const getProfile = async (userId) => {
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

  // Retourner les données (sans le mot de passe)
  const { motDePasse: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  getProfile,
};
