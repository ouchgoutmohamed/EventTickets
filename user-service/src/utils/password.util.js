const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

/**
 * Hacher un mot de passe
 * @param {String} password - Mot de passe en clair
 * @returns {Promise<String>} Mot de passe haché
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Erreur lors du hachage du mot de passe: ' + error.message);
  }
};

/**
 * Comparer un mot de passe avec son hash
 * @param {String} password - Mot de passe en clair
 * @param {String} hashedPassword - Mot de passe haché
 * @returns {Promise<Boolean>} true si correspond, false sinon
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe: ' + error.message);
  }
};

/**
 * Valider la force d'un mot de passe
 * @param {String} password - Mot de passe à valider
 * @returns {Object} { isValid: boolean, errors: array }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Le mot de passe est requis');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Générer un mot de passe aléatoire sécurisé
 * @param {Number} length - Longueur du mot de passe
 * @returns {String} Mot de passe généré
 */
const generateRandomPassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // S'assurer qu'au moins un caractère de chaque type est présent
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword,
};
