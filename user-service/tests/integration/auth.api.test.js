const request = require('supertest');
const app = require('../../src/app');

describe('Auth API - Tests d\'Intégration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('devrait valider les champs requis (422)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          // Manque nom, prenom, motDePasse
        });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('devrait valider le format de l\'email (422)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'Test',
          prenom: 'User',
          email: 'invalid-email',
          motDePasse: 'Password123!',
          roleNom: 'Utilisateur'
        });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('devrait valider la longueur du mot de passe (422)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'Test',
          prenom: 'User',
          email: 'test@test.com',
          motDePasse: '123', // Trop court
          roleNom: 'Utilisateur'
        });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait rejeter des identifiants invalides (401)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          motDePasse: 'wrongpassword',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait valider les champs requis (422)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          // Manque motDePasse
        });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('devrait rejeter sans token d\'authentification (401)', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter avec un token invalide (401)', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('devrait rejeter sans refresh token (400)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('devrait retourner le statut de santé du service (200)', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
