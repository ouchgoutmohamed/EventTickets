const app = require('./app');
const config = require('./config');

const PORT = config.port;

// Démarrer le serveur
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🚪 SIBE - API Gateway                                ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Server running on port ${PORT}                      ║`);
    console.log(`║  🌍 Environment: ${config.nodeEnv.padEnd(37)}║`);
    console.log(`║  📡 URL: http://localhost:${PORT}                       ║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  Services backend:                                     ║');
    console.log(`║  • User Service: ${config.services.userService.padEnd(32)}║`);
    console.log(`║  • Event Catalog: ${config.services.eventCatalog.padEnd(31)}║`);
    console.log(`║  • Ticket Inventory: ${config.services.ticketInventory.padEnd(28)}║`);
    console.log(`║  • Payment Service: ${config.services.payment.padEnd(29)}║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  Endpoints disponibles:                                ║');
    console.log('║  PUBLIC:                                               ║');
    console.log('║  • POST   /auth/login                                  ║');
    console.log('║  • POST   /auth/register                               ║');
    console.log('║  • GET    /events                                      ║');
    console.log('║  • GET    /events/:id                                  ║');
    console.log('║                                                        ║');
    console.log('║  PROTECTED (JWT Required):                             ║');
    console.log('║  • GET    /auth/profile                                ║');
    console.log('║  • GET    /users/:id                                   ║');
    console.log('║  • GET    /inventory/events/:eventId/availability      ║');
    console.log('║  • POST   /inventory/reservations                      ║');
    console.log('║  • POST   /inventory/reservations/:id/confirm          ║');
    console.log('║  • POST   /inventory/reservations/:id/release          ║');
    console.log('║  • GET    /inventory/users/:userId/reservations        ║');
    console.log('║  • POST   /payments                                    ║');
    console.log('║  • GET    /payments/:id                                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  });

  // Gestion de l'arrêt gracieux
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} reçu. Fermeture gracieuse en cours...`);
    
    server.close(() => {
      console.log('Serveur HTTP fermé');
      process.exit(0);
    });

    // Force l'arrêt après 10 secondes
    setTimeout(() => {
      console.error('Arrêt forcé après timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
