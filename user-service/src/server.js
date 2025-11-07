const app = require('./app');
const { PrismaClient } = require('./generated/prisma');

const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Vérifier la connexion à la base de données
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// Démarrer le serveur
const startServer = async () => {
  await checkDatabaseConnection();

  const server = app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🎫 SIBE - Service Utilisateur                        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Server running on port ${PORT}                     ║`);
    console.log(`║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                   ║`);
    console.log(`║  📡 URL: http://localhost:${PORT}                       ║`);
    console.log('║  📚 API Docs: http://localhost:' + PORT + '/api         ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  Endpoints disponibles:                                ║');
    console.log('║  • POST   /api/auth/register                           ║');
    console.log('║  • POST   /api/auth/login                              ║');
    console.log('║  • GET    /api/auth/profile                            ║');
    console.log('║  • PUT    /api/users/profile                           ║');
    console.log('║  • PUT    /api/users/password                          ║');
    console.log('║  • GET    /api/users/history/me                        ║');
    console.log('║  • GET    /api/roles                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  });

  // Gestion de l'arrêt gracieux
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} reçu. Fermeture gracieuse en cours...`);
    
    server.close(async () => {
      console.log('Serveur HTTP fermé');
      
      await prisma.$disconnect();
      console.log('Connexion Prisma fermée');
      
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

startServer().catch((error) => {
  console.error('Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});
