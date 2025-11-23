# API Gateway - EventTickets

API Gateway centralisée pour tous les microservices EventTickets. Ce service agit comme point d'entrée unique pour le frontend, gérant le routage vers les différents microservices backend.

## Architecture

Le gateway route les requêtes vers :
- **User Service** (http://localhost:3001) - Authentification et gestion des utilisateurs
- **Ticket Inventory Service** (http://localhost:8082) - Gestion des stocks et réservations de billets
- **Event Catalog Service** (http://localhost:8080) - Catalogue d'événements (à venir)
- **Payment Service** (http://localhost:8000) - Paiements et notifications (à venir)

## Prérequis

- Node.js 18+ 
- npm

## Installation

```bash
cd api-gateway
npm install
```

## Configuration

1. Créer un fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

2. Configurer les variables d'environnement :
```env
PORT=3000
USER_SERVICE_URL=http://localhost:3001
TICKET_INVENTORY_SERVICE_URL=http://localhost:8082
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

**Important:** Le `JWT_SECRET` doit être identique à celui configuré dans le user-service.

## Démarrage

```bash
npm run dev
# ou
npm start
```

Le gateway sera accessible sur http://localhost:3000

## Routes Disponibles

### Health Check
- `GET /health` - Vérifier l'état du gateway

### User Service (Auth & Users)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/profile` - Profil utilisateur (authentifié)
- `GET /api/users` - Liste des utilisateurs (admin)
- `PUT /api/users/profile` - Mettre à jour le profil
- `GET /api/roles` - Liste des rôles

### Ticket Inventory Service
- `GET /api/tickets/availability/:eventId` - Disponibilité des billets
- `POST /api/tickets/reserve` - Réserver des billets (authentifié)
- `POST /api/tickets/confirm` - Confirmer une réservation (authentifié)
- `POST /api/tickets/release` - Annuler une réservation (authentifié)
- `GET /api/tickets/user/:userId` - Réservations d'un utilisateur (authentifié)

## Authentification

Le gateway propage les tokens JWT aux services backend. Les routes protégées nécessitent un header :
```
Authorization: Bearer <token>
```

## Développement

### Structure du projet
```
api-gateway/
├── src/
│   ├── config/          # Configuration centralisée
│   ├── middlewares/     # Middlewares (auth, errors)
│   ├── routes/          # Routes et proxies
│   ├── app.js           # Application Express
│   └── server.js        # Point d'entrée
├── .env.example
├── package.json
└── README.md
```

### Ajouter un nouveau service

1. Ajouter l'URL du service dans `.env` et `src/config/index.js`
2. Créer un fichier de routes dans `src/routes/`
3. Ajouter le proxy avec `http-proxy-middleware`
4. Importer et monter les routes dans `src/app.js`

Exemple :
```javascript
// src/routes/new-service.routes.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = express.Router();

router.use('/', createProxyMiddleware({
  target: config.services.newService,
  changeOrigin: true,
  pathRewrite: { '^/api/new-service': '/api' },
}));

module.exports = router;
```

## Gestion des erreurs

Le gateway gère automatiquement :
- Erreurs de proxy (service indisponible)
- Erreurs d'authentification JWT
- Routes non trouvées (404)
- Erreurs internes (500)

## CORS

Le gateway est configuré pour accepter les requêtes depuis :
- http://localhost:5173 (frontend Vite)
- http://localhost:3000

Headers autorisés :
- Authorization
- Idempotency-Key
- Content-Type

## Logs

Le gateway affiche les logs pour :
- Chaque requête proxy avec la destination
- Erreurs de proxy
- Erreurs d'authentification

## Production

Pour un déploiement en production :
1. Configurer les URLs des services avec les adresses réelles
2. Utiliser un JWT_SECRET fort et unique
3. Configurer CORS avec les domaines autorisés uniquement
4. Mettre NODE_ENV=production
5. Utiliser un process manager (PM2, systemd)

```bash
NODE_ENV=production npm start
```

## Troubleshooting

### Le gateway ne démarre pas
- Vérifier que le port 3000 est disponible
- Vérifier que les variables d'environnement sont correctement définies

### Les services backend sont inaccessibles
- Vérifier que les services sont démarrés
- Vérifier les URLs dans `.env`
- Consulter les logs du gateway

### Erreurs CORS
- Vérifier que l'origine du frontend est dans CORS_ORIGIN
- Vérifier que les headers sont autorisés

### Erreurs d'authentification
- Vérifier que JWT_SECRET est identique au user-service
- Vérifier que le token est valide et non expiré
