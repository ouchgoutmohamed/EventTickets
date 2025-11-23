# API Gateway - Quick Reference

## Démarrage rapide

```bash
cd api-gateway
npm install
cp .env.example .env
# Éditer .env: configurer JWT_SECRET identique au user-service
npm run dev
```

## Routes disponibles

### 🔓 Routes publiques (pas de token requis)

| Méthode | Route | Service cible | Description |
|---------|-------|---------------|-------------|
| POST | `/auth/login` | user-service | Connexion utilisateur |
| POST | `/auth/register` | user-service | Inscription utilisateur |
| POST | `/auth/refresh` | user-service | Rafraîchir le token |
| GET | `/events` | EventCatalogService | Liste des événements |
| GET | `/events/:id` | EventCatalogService | Détails d'un événement |

### 🔒 Routes protégées (JWT requis)

#### Authentification & Profil
| Méthode | Route | Service cible | Description |
|---------|-------|---------------|-------------|
| GET | `/auth/profile` | user-service | Profil utilisateur connecté |
| POST | `/auth/logout` | user-service | Déconnexion |

#### Utilisateurs
| Méthode | Route | Service cible | Description |
|---------|-------|---------------|-------------|
| GET | `/users/:id` | user-service | Détails utilisateur |
| PUT | `/users/profile` | user-service | Modifier profil |
| PUT | `/users/password` | user-service | Changer mot de passe |

#### Inventaire & Réservations
| Méthode | Route | Service cible | Description |
|---------|-------|---------------|-------------|
| GET | `/inventory/events/:eventId/availability` | TicketInventoryService | Disponibilité billets |
| POST | `/inventory/reservations` | TicketInventoryService | Créer réservation |
| POST | `/inventory/reservations/:id/confirm` | TicketInventoryService | Confirmer réservation |
| POST | `/inventory/reservations/:id/release` | TicketInventoryService | Libérer réservation |
| GET | `/inventory/users/:userId/reservations` | TicketInventoryService | Réservations utilisateur |

#### Paiements
| Méthode | Route | Service cible | Description |
|---------|-------|---------------|-------------|
| POST | `/payments` | paymentService | Créer paiement |
| GET | `/payments/:id` | paymentService | Détails paiement |
| POST | `/payments/:id/refund` | paymentService | Rembourser paiement |

## Utilisation avec curl

### Route publique
```bash
curl http://localhost:3000/events
```

### Route protégée
```bash
# 1. Obtenir un token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","motDePasse":"password"}' \
  | jq -r '.token')

# 2. Utiliser le token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/inventory/reservations
```

## Utilisation avec JavaScript/Fetch

### Route publique
```javascript
const response = await fetch('http://localhost:3000/events');
const events = await response.json();
```

### Route protégée
```javascript
const token = localStorage.getItem('token'); // ou depuis votre state management

const response = await fetch('http://localhost:3000/inventory/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    eventId: '123',
    quantity: 2
  })
});

const reservation = await response.json();
```

## Codes de statut HTTP

| Code | Signification | Cause possible |
|------|---------------|----------------|
| 200 | OK | Requête réussie |
| 401 | Unauthorized | Token manquant, invalide ou expiré |
| 404 | Not Found | Route inexistante |
| 503 | Service Unavailable | Service backend indisponible |
| 500 | Internal Server Error | Erreur serveur |

## Format des erreurs

### Erreur d'authentification
```json
{
  "success": false,
  "message": "Token d'authentification manquant"
}
```

### Service indisponible
```json
{
  "success": false,
  "message": "Service d'inventaire temporairement indisponible"
}
```

## Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `PORT` | 3000 | Port du serveur |
| `JWT_SECRET` | (requis) | Secret JWT (identique au user-service) |
| `USER_SERVICE_URL` | http://localhost:3001 | URL du user-service |
| `EVENT_CATALOG_SERVICE_URL` | http://localhost:8080 | URL du EventCatalogService |
| `TICKET_INVENTORY_SERVICE_URL` | http://localhost:8082 | URL du TicketInventoryService |
| `PAYMENT_SERVICE_URL` | http://localhost:8083 | URL du paymentService |
| `CORS_ORIGIN` | http://localhost:5173 | Origines autorisées (séparées par des virgules) |
| `NODE_ENV` | development | Environnement (development/production) |

## Commandes utiles

```bash
# Démarrer en mode développement (avec rechargement automatique)
npm run dev

# Démarrer en mode production
npm start

# Tester la santé du service
curl http://localhost:3000/health

# Voir les endpoints disponibles
curl http://localhost:3000/

# Générer un token de test
node test-integration.js
```

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| "Service indisponible" | Vérifier que le service backend est démarré |
| "Token invalide" | Vérifier que JWT_SECRET est identique dans api-gateway et user-service |
| Erreur CORS | Ajouter l'origine du frontend dans CORS_ORIGIN |
| "Route non trouvée" | Vérifier que la route commence par /auth, /users, /events, /inventory ou /payments |

## Headers ajoutés automatiquement

L'API Gateway ajoute ces headers aux requêtes vers les services backend:

| Header | Valeur | Quand |
|--------|--------|-------|
| `X-User-Id` | ID de l'utilisateur | Token valide |
| `X-User-Role` | Rôle de l'utilisateur | Token valide |
| `X-User-Email` | Email de l'utilisateur | Token valide |

Les services backend peuvent lire ces headers pour identifier l'utilisateur sans devoir vérifier le JWT eux-mêmes.

## Documentation complète

- [README.md](./README.md) - Documentation complète
- [SECURITY.md](./SECURITY.md) - Analyse de sécurité
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement
