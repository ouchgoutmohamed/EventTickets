const app = require('./app');
const config = require('./config');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎫 EventTickets - API Gateway                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Server running on port ${PORT}                        ║`);
  console.log(`║  🌍 Environment: ${config.nodeEnv.padEnd(37)}║`);
  console.log(`║  📡 URL: http://localhost:${PORT}                       ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  🔗 Service Endpoints:                                 ║');
  console.log(`║  • User Service: ${config.services.userService.padEnd(28)}║`);
  console.log(`║  • Ticket Inventory: ${config.services.ticketInventoryService.padEnd(24)}║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  📚 Gateway Routes:                                    ║');
  console.log('║  • GET    /health                                      ║');
  console.log('║  • POST   /api/auth/register                           ║');
  console.log('║  • POST   /api/auth/login                              ║');
  console.log('║  • GET    /api/auth/profile                            ║');
  console.log('║  • GET    /api/users                                   ║');
  console.log('║  • GET    /api/roles                                   ║');
  console.log('║  • GET    /api/tickets/availability/:eventId           ║');
  console.log('║  • POST   /api/tickets/reserve                         ║');
  console.log('║  • POST   /api/tickets/confirm                         ║');
  console.log('║  • POST   /api/tickets/release                         ║');
  console.log('║  • GET    /api/tickets/user/:userId                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
