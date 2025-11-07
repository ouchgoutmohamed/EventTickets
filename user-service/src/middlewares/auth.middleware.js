const { verifyToken, extractTokenFromHeader } = require('../utils/jwt.util');
const { unauthorizedResponse } = require('../utils/response.util');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return unauthorizedResponse(res, 'Token d\'authentification manquant');
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return unauthorizedResponse(res, error.message);
    }

    // Vérifier si l'utilisateur existe et est actif
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        profil: true,
      },
    });

    if (!user) {
      return unauthorizedResponse(res, 'Utilisateur non trouvé');
    }

    if (user.etat !== 'actif') {
      return unauthorizedResponse(res, 'Compte utilisateur inactif ou suspendu');
    }

    // Attacher les informations de l'utilisateur à la requête
    req.user = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role.nom,
      roleId: user.roleId,
      permissions: user.role.permissions,
    };

    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return unauthorizedResponse(res, 'Erreur lors de l\'authentification');
  }
};

/**
 * Middleware optionnel d'authentification
 * Attache les informations de l'utilisateur si le token est présent et valide
 * Mais ne bloque pas si le token est absent
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    });

    if (user && user.etat === 'actif') {
      req.user = {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role.nom,
        roleId: user.roleId,
        permissions: user.role.permissions,
      };
    }

    next();
  } catch (error) {
    console.error('Erreur dans optionalAuthenticate:', error);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
