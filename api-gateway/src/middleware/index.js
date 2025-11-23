const { authMiddleware } = require('./authMiddleware');
const { loggingMiddleware } = require('./loggingMiddleware');

module.exports = {
  authMiddleware,
  loggingMiddleware,
};
