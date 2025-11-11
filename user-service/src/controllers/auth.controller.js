const { authService } = require('../services');
const { successResponse, errorResponse } = require('../utils/response.util');
const { verifyRefreshToken } = require('../utils/jwt.util');

/**
 * Contrôleur d'inscription
 */
const register = async (req, res, next) => {
  try {
    const { nom, prenom, email, roleId, roleNom } = req.body;
    // Accepter motDePasse (français) ou password (anglais)
    const motDePasse = req.body.motDePasse || req.body.password;

    const result = await authService.register(
      { nom, prenom, email, motDePasse, roleId, roleNom },
      req
    );

    return successResponse(
      res,
      201,
      'Inscription réussie',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur de connexion
 */
const login = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Accepter motDePasse (français) ou password (anglais)
    const motDePasse = req.body.motDePasse || req.body.password;

    const result = await authService.login(email, motDePasse, req);

    return successResponse(
      res,
      200,
      'Connexion réussie',
      result
    );
  } catch (error) {
    if (error.message.includes('Email ou mot de passe incorrect') ||
        error.message.includes('inactif') ||
        error.message.includes('suspendu')) {
      return errorResponse(res, 401, error.message);
    }
    next(error);
  }
};

/**
 * Contrôleur de rafraîchissement du token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 400, 'Refresh token manquant');
    }

    // Vérifier le refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return errorResponse(res, 401, error.message);
    }

    const result = await authService.refreshAccessToken(decoded.userId);

    return successResponse(
      res,
      200,
      'Token rafraîchi avec succès',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur de récupération du profil
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await authService.getProfile(userId);

    return successResponse(
      res,
      200,
      'Profil récupéré avec succès',
      { user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur de déconnexion
 * Note: Avec JWT, la déconnexion côté serveur est optionnelle
 * Elle se fait généralement côté client en supprimant le token
 */
const logout = async (req, res) => {
  // Optionnel: Ajouter le token à une blacklist si nécessaire
  return successResponse(
    res,
    200,
    'Déconnexion réussie',
    { message: 'Veuillez supprimer le token côté client' }
  );
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
};
