# API Gateway - EventTickets

Point d'entrée unique pour tous les microservices du système de billetterie SIBE.

## Description

L'API Gateway centralise l'accès à tous les microservices backend et gère :
- **Authentification JWT** : Vérification des tokens pour les routes protégées
- **Routage intelligent** : Redirection des requêtes vers les services appropriés
- **Headers d'identification** : Injection automatique de `X-User-Id` et `X-User-Role`
- **CORS** : Configuration centralisée pour le frontend
- **Logging** : Traçabilité des requêtes

## Architecture

```
Frontend (React)
       ↓
  API Gateway (Port 3000)
       ↓
   ┌─────┴─────┬──────────┬────────────┐
   ↓           ↓          ↓            ↓
User Service  Events  Inventory    Payment
(Port 3001)  (8080)    (8082)       (8083)
```

## Configuration

1. Copier `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Configurer les variables d'environnement:
```env
PORT=3000
JWT_SECRET=<même secret que user-service>
USER_SERVICE_URL=http://localhost:3001
EVENT_CATALOG_SERVICE_URL=http://localhost:8080
TICKET_INVENTORY_SERVICE_URL=http://localhost:8082
PAYMENT_SERVICE_URL=http://localhost:8083
CORS_ORIGIN=http://localhost:5173
```

## Installation

```bash
npm install
```

## Démarrage

### Mode développement (avec rechargement automatique)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## Routes disponibles

### Routes publiques (sans authentification)

#### Authentification
- `POST /auth/login` → User Service
- `POST /auth/register` → User Service

#### Événements
- `GET /events` → Event Catalog Service
- `GET /events/:id` → Event Catalog Service

### Routes protégées (JWT requis)

#### Authentification
- `GET /auth/profile` → User Service
- `POST /auth/logout` → User Service

#### Utilisateurs
- `GET /users/:id` → User Service

#### Inventaire & Réservations
- `GET /inventory/events/:eventId/availability` → Ticket Inventory Service
- `POST /inventory/reservations` → Ticket Inventory Service
- `POST /inventory/reservations/:id/confirm` → Ticket Inventory Service
- `POST /inventory/reservations/:id/release` → Ticket Inventory Service
- `GET /inventory/users/:userId/reservations` → Ticket Inventory Service

#### Paiements
- `POST /payments` → Payment Service
- `GET /payments/:id` → Payment Service
- `POST /payments/:id/refund` → Payment Service

## Authentification

### Utilisation du JWT

Les routes protégées nécessitent un header `Authorization`:
```
Authorization: Bearer <jwt-token>
```

### Injection de headers

La Gateway ajoute automatiquement ces headers aux requêtes proxifiées:
- `X-User-Id`: ID de l'utilisateur authentifié
- `X-User-Role`: Rôle de l'utilisateur (USER, ADMIN, ORGANIZER)
- `X-User-Email`: Email de l'utilisateur

### Réponses d'erreur

- **401 Unauthorized** : Token manquant, invalide ou expiré
- **404 Not Found** : Route inexistante
- **503 Service Unavailable** : Service backend indisponible

## Intégration Frontend

Configuration du frontend (`.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
```

Exemple d'appel API:
```javascript
// Avec authentification
const response = await fetch('http://localhost:3000/inventory/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ eventId, quantity })
});

// Sans authentification
const events = await fetch('http://localhost:3000/events');
```

## Logging

En développement, les logs affichent:
- Méthode HTTP et URL
- Utilisateur (ID ou "anonymous")
- Code de statut HTTP
- Durée de traitement

## Sécurité

- Vérification systématique du JWT pour les routes protégées
- Validation de la signature et de l'expiration du token
- Pas d'exposition des détails des microservices au frontend
- Headers CORS restrictifs en production

## Développement

Structure du projet:
```
api-gateway/
├── src/
│   ├── middleware/
│   │   ├── authMiddleware.js    # Authentification JWT
│   │   ├── loggingMiddleware.js # Logging des requêtes
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js              # Routes auth
│   │   ├── users.js             # Routes users
│   │   ├── events.js            # Routes events
│   │   ├── inventory.js         # Routes inventory
│   │   ├── payments.js          # Routes payments
│   │   └── index.js
│   ├── app.js                   # Configuration Express
│   ├── config.js                # Configuration
│   └── server.js                # Point d'entrée
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Sécurité

Voir [SECURITY.md](./SECURITY.md) pour les détails complets de la sécurité.

### Points de sécurité implémentés

- ✅ Authentification JWT avec vérification de signature et expiration
- ✅ Séparation claire entre routes publiques et protégées
- ✅ Injection sécurisée des headers utilisateur vers les microservices
- ✅ Gestion d'erreurs sans fuite d'informations sensibles
- ✅ Configuration CORS appropriée
- ✅ Logging des requêtes pour audit

### Améliorations futures recommandées

- Rate limiting (voir CodeQL alerts dans SECURITY.md)
- Headers de sécurité additionnels (Helmet.js)
- Validation et sanitisation des entrées

## Dépannage

### Service backend indisponible
Vérifier que tous les services sont démarrés:
- User Service (3001)
- Event Catalog Service (8080)
- Ticket Inventory Service (8082)
- Payment Service (8083)

### Erreur CORS
Vérifier la variable `CORS_ORIGIN` dans `.env`

### Erreur JWT
Vérifier que `JWT_SECRET` est identique dans l'API Gateway et le User Service
