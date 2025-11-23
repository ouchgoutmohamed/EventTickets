#!/usr/bin/env node

/**
 * Test d'intégration de l'API Gateway
 * 
 * Ce script démontre:
 * 1. Comment générer un JWT token valide
 * 2. Comment appeler les routes protégées avec le token
 * 3. Comment appeler les routes publiques sans token
 */

const jwt = require('jsonwebtoken');

// Configuration (doit correspondre à .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

// Générer un token JWT de test
const generateTestToken = () => {
  const payload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'USER',
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'sibe-user-service',
  });

  return token;
};

// Générer un token expiré pour tester le rejet
const generateExpiredToken = () => {
  const payload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '-1h', // Expiré il y a 1 heure
    issuer: 'sibe-user-service',
  });

  return token;
};

console.log('====================================');
console.log('Test d\'intégration API Gateway');
console.log('====================================\n');

// Test 1: Token valide
console.log('1. Token JWT valide généré:');
const validToken = generateTestToken();
console.log(validToken.substring(0, 50) + '...');
console.log('');

// Décoder le token pour voir le contenu
const decoded = jwt.decode(validToken);
console.log('Contenu du token décodé:');
console.log(JSON.stringify(decoded, null, 2));
console.log('');

// Test 2: Token expiré
console.log('2. Token JWT expiré généré (pour test de rejet):');
const expiredToken = generateExpiredToken();
console.log(expiredToken.substring(0, 50) + '...');
console.log('');

// Instructions pour tester manuellement
console.log('====================================');
console.log('Instructions de test manuel');
console.log('====================================\n');

console.log('Test avec token valide (devrait réussir):');
console.log(`curl -H "Authorization: Bearer ${validToken}" ${API_GATEWAY_URL}/inventory/reservations`);
console.log('');

console.log('Test avec token expiré (devrait échouer avec 401):');
console.log(`curl -H "Authorization: Bearer ${expiredToken}" ${API_GATEWAY_URL}/inventory/reservations`);
console.log('');

console.log('Test sans token (devrait échouer avec 401):');
console.log(`curl ${API_GATEWAY_URL}/inventory/reservations`);
console.log('');

console.log('Test route publique sans token (devrait fonctionner):');
console.log(`curl ${API_GATEWAY_URL}/events`);
console.log('');

console.log('====================================');
console.log('Vérification de la configuration');
console.log('====================================\n');
console.log(`JWT_SECRET: ${JWT_SECRET.substring(0, 10)}...`);
console.log(`API_GATEWAY_URL: ${API_GATEWAY_URL}`);
console.log('');
console.log('⚠️  IMPORTANT: Le JWT_SECRET doit être identique dans:');
console.log('   - api-gateway/.env');
console.log('   - user-service/.env');
console.log('');
