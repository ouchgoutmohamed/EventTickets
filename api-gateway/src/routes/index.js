const authRoutes = require('./auth');
const usersRoutes = require('./users');
const eventsRoutes = require('./events');
const inventoryRoutes = require('./inventory');
const paymentsRoutes = require('./payments');
const ticketsRoutes = require('./tickets');

module.exports = {
  authRoutes,
  usersRoutes,
  eventsRoutes,
  inventoryRoutes,
  paymentsRoutes,
  ticketsRoutes,
};
