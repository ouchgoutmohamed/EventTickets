const request = require('supertest');
const app = require('../../src/app');

describe('User API - Tests d\'Intégration Basiques', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('devrait rejeter sans authentification (401)', async () => {
      // Act
      const response = await request(app)
        .get('/api/users');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('devrait rejeter sans authentification (401)', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/1');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('devrait rejeter sans authentification (401)', async () => {
      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .send({ nom: 'Test' });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/password', () => {
    it('devrait rejeter sans authentification (401)', async () => {
      // Act
      const response = await request(app)
        .put('/api/users/password')
        .send({
          ancienMotDePasse: 'oldPassword',
          nouveauMotDePasse: 'NewPassword123!',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('devrait rejeter sans authentification (401)', async () => {
      // Act
      const response = await request(app)
        .delete('/api/users/2');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /', () => {
    it('devrait retourner les informations du service (200)', async () => {
      // Act
      const response = await request(app)
        .get('/');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('service');
    });
  });
});
