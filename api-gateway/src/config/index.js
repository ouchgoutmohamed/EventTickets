require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    ticketInventoryService: process.env.TICKET_INVENTORY_SERVICE_URL || 'http://localhost:8082',
    eventCatalogService: process.env.EVENT_CATALOG_SERVICE_URL || 'http://localhost:8080',
    paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};
