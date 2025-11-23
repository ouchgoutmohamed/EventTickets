require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  },
  
  // Service URLs
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    eventCatalog: process.env.EVENT_CATALOG_SERVICE_URL || 'http://localhost:8080',
    ticketInventory: process.env.TICKET_INVENTORY_SERVICE_URL || 'http://localhost:8082',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8083',
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
