/**
 * Extraire les informations de la requête HTTP
 * @param {Object} req - Objet request Express
 * @returns {Object} Informations extraites
 */
const extractRequestInfo = (req) => {
  return {
    ip: getClientIp(req),
    userAgent: req.get('user-agent') || 'Unknown',
    browser: extractBrowser(req),
    os: extractOS(req),
    device: extractDevice(req),
  };
};

/**
 * Obtenir l'adresse IP du client
 * @param {Object} req - Objet request Express
 * @returns {String} Adresse IP
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress ||
    'Unknown'
  );
};

/**
 * Extraire le navigateur du user agent
 * @param {Object} req - Objet request Express
 * @returns {String} Nom du navigateur
 */
const extractBrowser = (req) => {
  const userAgent = req.get('user-agent') || '';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
};

/**
 * Extraire le système d'exploitation du user agent
 * @param {Object} req - Objet request Express
 * @returns {String} Nom du système d'exploitation
 */
const extractOS = (req) => {
  const userAgent = req.get('user-agent') || '';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Unknown';
};

/**
 * Extraire le type d'appareil du user agent
 * @param {Object} req - Objet request Express
 * @returns {String} Type d'appareil
 */
const extractDevice = (req) => {
  const userAgent = req.get('user-agent') || '';
  
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  
  return 'Desktop';
};

module.exports = {
  extractRequestInfo,
  getClientIp,
  extractBrowser,
  extractOS,
  extractDevice,
};
