const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Créer les rôles
  const roleClient = await prisma.role.upsert({
    where: { nom: 'client' },
    update: {},
    create: {
      nom: 'client',
      description: 'Utilisateur client standard',
      permissions: {
        canBuyTickets: true,
        canViewEvents: true,
        canManageProfile: true,
      },
    },
  });

  const roleOrganisateur = await prisma.role.upsert({
    where: { nom: 'organisateur' },
    update: {},
    create: {
      nom: 'organisateur',
      description: 'Organisateur d\'événements',
      permissions: {
        canBuyTickets: true,
        canViewEvents: true,
        canManageProfile: true,
        canCreateEvents: true,
        canManageEvents: true,
        canViewStats: true,
      },
    },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { nom: 'administrateur' },
    update: {},
    create: {
      nom: 'administrateur',
      description: 'Administrateur de la plateforme',
      permissions: {
        fullAccess: true,
        canManageUsers: true,
        canManageRoles: true,
        canViewAllData: true,
      },
    },
  });

  console.log('✅ Rôles créés:', { roleClient, roleOrganisateur, roleAdmin });

  // Créer un utilisateur admin par défaut
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sibe.com' },
    update: {},
    create: {
      nom: 'Administrateur',
      prenom: 'Système',
      email: 'admin@sibe.com',
      motDePasse: hashedPassword,
      etat: 'actif',
      emailVerifie: true,
      roleId: roleAdmin.id,
      profil: {
        create: {
          telephone: '+33 1 23 45 67 89',
          ville: 'Paris',
          pays: 'France',
          preferences: {
            notifications: true,
            langue: 'fr',
          },
        },
      },
    },
  });

  console.log('✅ Utilisateur admin créé:', adminUser.email);

  // Créer un utilisateur organisateur par défaut
  const orgPassword = await bcrypt.hash('Org@123', 10);
  
  const orgUser = await prisma.user.upsert({
    where: { email: 'organisateur@sibe.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'organisateur@sibe.com',
      motDePasse: orgPassword,
      etat: 'actif',
      emailVerifie: true,
      roleId: roleOrganisateur.id,
      profil: {
        create: {
          telephone: '+33 6 12 34 56 78',
          ville: 'Lyon',
          pays: 'France',
          preferences: {
            notifications: true,
            langue: 'fr',
          },
        },
      },
    },
  });

  console.log('✅ Utilisateur organisateur créé:', orgUser.email);

  // Créer un utilisateur client par défaut
  const clientPassword = await bcrypt.hash('Client@123', 10);
  
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@sibe.com' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Jean',
      email: 'client@sibe.com',
      motDePasse: clientPassword,
      etat: 'actif',
      emailVerifie: true,
      roleId: roleClient.id,
      profil: {
        create: {
          telephone: '+33 6 98 76 54 32',
          ville: 'Marseille',
          pays: 'France',
          preferences: {
            notifications: true,
            langue: 'fr',
          },
        },
      },
    },
  });

  console.log('✅ Utilisateur client créé:', clientUser.email);

  console.log('\n🎉 Seeding terminé avec succès!');
  console.log('\n📋 Comptes de test créés:');
  console.log('   Admin: admin@sibe.com / Admin@123');
  console.log('   Organisateur: organisateur@sibe.com / Org@123');
  console.log('   Client: client@sibe.com / Client@123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
