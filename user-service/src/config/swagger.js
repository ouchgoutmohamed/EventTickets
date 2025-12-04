const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eventify User Service API',
      version: '1.0.0',
      description: 'API REST pour la gestion des utilisateurs, de l\'authentification et des autorisations de la plateforme Eventify',
      contact: {
        name: 'Eventify Team',
        email: 'support@eventify.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Serveur de développement',
      },
      {
        url: 'http://localhost:8080',
        description: 'API Gateway',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints pour l\'authentification et la gestion des sessions',
      },
      {
        name: 'Users',
        description: 'Endpoints pour la gestion des utilisateurs',
      },
      {
        name: 'Roles',
        description: 'Endpoints pour la gestion des rôles et permissions',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via l\'endpoint /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique de l\'utilisateur',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur',
            },
            prenom: {
              type: 'string',
              description: 'Prénom de l\'utilisateur',
            },
            nom: {
              type: 'string',
              description: 'Nom de famille de l\'utilisateur',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ORGANIZER', 'ADMIN'],
              description: 'Rôle de l\'utilisateur',
            },
            isActive: {
              type: 'boolean',
              description: 'Statut d\'activation du compte',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière mise à jour',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'motDePasse', 'nom', 'prenom'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'Adresse email de l\'utilisateur',
            },
            motDePasse: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'SecurePass123!',
              description: 'Mot de passe (minimum 8 caractères)',
            },
            nom: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Doe',
              description: 'Nom de famille',
            },
            prenom: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'John',
              description: 'Prénom',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'motDePasse'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'Adresse email',
            },
            motDePasse: {
              type: 'string',
              format: 'password',
              example: 'SecurePass123!',
              description: 'Mot de passe',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            prenom: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'John',
              description: 'Prénom',
            },
            nom: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Doe',
              description: 'Nom de famille',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'newemail@example.com',
              description: 'Adresse email',
            },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['ancienMotDePasse', 'nouveauMotDePasse'],
          properties: {
            ancienMotDePasse: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Mot de passe actuel',
              example: 'OldPass123!',
            },
            nouveauMotDePasse: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Nouveau mot de passe (minimum 8 caractères)',
              example: 'NewPass456!',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message d\'erreur',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Erreur de validation',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Email invalide',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Token non fourni',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Accès refusé - Permissions insuffisantes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Accès interdit',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Utilisateur non trouvé',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Chemins vers les fichiers contenant les annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
