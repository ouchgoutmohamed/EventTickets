/**
 * Middleware de logging des requêtes
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, url, headers } = req;
  const userId = req.user ? req.user.id : 'anonymous';

  // Log de la requête entrante
  console.log(`[${new Date().toISOString()}] ${method} ${url} - User: ${userId}`);

  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - Status: ${res.statusCode} - Duration: ${duration}ms`
    );
    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  loggingMiddleware,
};
