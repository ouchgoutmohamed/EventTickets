// Placeholder pour les middlewares
// Les middlewares seront ajoutés dans les prochaines étapes

const authMiddleware = require('./auth.middleware');
const roleMiddleware = require('./role.middleware');
const validationMiddleware = require('./validation.middleware');
const errorMiddleware = require('./error.middleware');

module.exports = {
  ...authMiddleware,
  ...roleMiddleware,
  ...validationMiddleware,
  ...errorMiddleware,
};

