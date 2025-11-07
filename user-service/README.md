# 🎫 SIBE - Service Utilisateur

## Description

# 🎫 SIBE - Service Utilisateur

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack Technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Endpoints API](#endpoints-api)
- [Modèles de données](#modèles-de-données)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Déploiement](#déploiement)

## 🎯 Vue d'ensemble

Le **Service Utilisateur** est un microservice du système SIBE (Système Intelligent de Billetterie Événementielle) responsable de la gestion complète des utilisateurs, de l'authentification, et des autorisations.

## ✨ Fonctionnalités

### Authentification & Autorisation

- ✅ Inscription d'utilisateurs avec validation
- ✅ Connexion sécurisée avec JWT
- ✅ Rafraîchissement des tokens
- ✅ Gestion des rôles (Client, Organisateur, Administrateur)
- ✅ Vérification des permissions

### Gestion des Utilisateurs

- ✅ CRUD complet des utilisateurs
- ✅ Gestion des profils utilisateur
- ✅ Changement de mot de passe
- ✅ Activation/désactivation de comptes
- ✅ Attribution de rôles

### Traçabilité

- ✅ Historique des connexions
- ✅ Enregistrement de l'IP, navigateur, OS
- ✅ Suivi des tentatives échouées

## 🏗️ Architecture

```
user-service/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── seed.js                # Données de test
├── src/
│   ├── controllers/           # Logique de contrôle
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── role.controller.js
│   ├── middlewares/           # Middlewares Express
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── routes/                # Définition des routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── role.routes.js
│   ├── services/              # Logique métier
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   └── role.service.js
│   ├── utils/                 # Utilitaires
│   │   ├── jwt.util.js
│   │   ├── password.util.js
│   │   ├── response.util.js
│   │   └── request.util.js
│   ├── app.js                 # Configuration Express
│   └── server.js              # Point d'entrée
├── .env.example               # Template de configuration
├── api.rest                   # Tests API
└── package.json
```

## 🛠️ Stack Technique

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 5.x
- **Base de données:** MySQL (base unique `sibe_db` partagée)
- **ORM:** Prisma 6.x
- **Authentification:** JWT (jsonwebtoken)
- **Hachage:** bcrypt
- **Validation:** express-validator

> **Note Architecture**: Ce service utilise une base de données unique (`sibe_db`) partagée avec tous les autres microservices SIBE pour simplifier le développement et le déploiement.

## 📦 Installation

### Prérequis

- Node.js >= 18.x
- MySQL >= 8.0 ou PostgreSQL >= 14
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**

```bash
cd user-service
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer l'environnement**

```bash
cp .env.example .env
```

4. **Éditer le fichier .env**

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://user:password@localhost:3306/sibe_users"
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=votre_refresh_secret_jwt
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

5. **Générer le client Prisma**

```bash
npm run prisma:generate
```

6. **Créer la base de données et appliquer les migrations**

```bash
npm run prisma:migrate
```

7. **Peupler la base de données avec des données de test**

```bash
npm run prisma:seed
```

### 🚀 Installation rapide (tout en une commande)

```bash
npm run setup
```

Cette commande exécute automatiquement :

- Installation des dépendances
- Génération du client Prisma
- Création et migration de la base de données
- Peuplement avec les données de test

## ⚙️ Configuration

### Variables d'environnement

| Variable                 | Description                            | Défaut      |
| ------------------------ | -------------------------------------- | ----------- |
| `PORT`                   | Port du serveur                        | 3001        |
| `NODE_ENV`               | Environnement (development/production) | development |
| `DATABASE_URL`           | URL de connexion à la base de données  | -           |
| `JWT_SECRET`             | Secret pour signer les JWT             | -           |
| `JWT_EXPIRES_IN`         | Durée de validité du token             | 24h         |
| `JWT_REFRESH_SECRET`     | Secret pour les refresh tokens         | -           |
| `JWT_REFRESH_EXPIRES_IN` | Durée de validité du refresh token     | 7d          |
| `BCRYPT_ROUNDS`          | Nombre de rounds bcrypt                | 10          |
| `CORS_ORIGIN`            | Origine autorisée pour CORS            | \*          |

## 🎮 Utilisation

### Démarrage en développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001` avec rechargement automatique (nodemon).

### Démarrage en production

```bash
npm start
```

### Outils Prisma

```bash
# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Créer une nouvelle migration
npm run prisma:migrate

# Réinitialiser la base de données
npm run prisma:reset

# Régénérer le client Prisma
npm run prisma:generate
```

## 📡 Endpoints API

### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint    | Description                      | Authentification |
| ------- | ----------- | -------------------------------- | ---------------- |
| POST    | `/register` | Inscription                      | Non              |
| POST    | `/login`    | Connexion                        | Non              |
| POST    | `/refresh`  | Rafraîchir le token              | Non              |
| GET     | `/profile`  | Profil de l'utilisateur connecté | Oui              |
| POST    | `/logout`   | Déconnexion                      | Oui              |

### 👤 Utilisateurs (`/api/users`)

| Méthode | Endpoint       | Description                      | Rôle requis       |
| ------- | -------------- | -------------------------------- | ----------------- |
| GET     | `/`            | Liste des utilisateurs (paginée) | Admin             |
| GET     | `/:id`         | Détails d'un utilisateur         | Soi-même ou Admin |
| PUT     | `/profile`     | Mettre à jour son profil         | Authentifié       |
| PUT     | `/password`    | Changer son mot de passe         | Authentifié       |
| GET     | `/history/me`  | Son historique de connexions     | Authentifié       |
| GET     | `/:id/history` | Historique d'un utilisateur      | Admin             |
| PUT     | `/:id/disable` | Désactiver un compte             | Admin             |
| PUT     | `/:id/enable`  | Activer un compte                | Admin             |
| PUT     | `/:id/role`    | Attribuer un rôle                | Admin             |
| DELETE  | `/:id`         | Supprimer un utilisateur         | Admin             |

### 🎭 Rôles (`/api/roles`)

| Méthode | Endpoint | Description           | Rôle requis |
| ------- | -------- | --------------------- | ----------- |
| GET     | `/`      | Liste des rôles       | Authentifié |
| GET     | `/:id`   | Détails d'un rôle     | Admin       |
| POST    | `/`      | Créer un rôle         | Admin       |
| PUT     | `/:id`   | Mettre à jour un rôle | Admin       |
| DELETE  | `/:id`   | Supprimer un rôle     | Admin       |

## 📊 Modèles de données

### User (Utilisateur)

```typescript
{
  id: number
  nom: string
  prenom: string
  email: string (unique)
  motDePasse: string (haché)
  etat: string (actif/inactif/suspendu)
  roleId: number
  emailVerifie: boolean
  dateCreation: DateTime
  role: Role
  profil: Profil
  historiqueConnexions: HistoriqueConnexion[]
}
```

### Profil (Profile)

```typescript
{
  id: number
  utilisateurId: number
  adresse: string?
  ville: string?
  codePostal: string?
  pays: string?
  telephone: string?
  dateNaissance: DateTime?
  photo: string?
  preferences: JSON?
}
```

### Role

```typescript
{
  id: number
  nom: string (unique)
  description: string?
  permissions: JSON?
  users: User[]
}
```

### HistoriqueConnexion (ConnectionHistory)

```typescript
{
  id: number;
  utilisateurId: number;
  dateConnexion: DateTime;
  adresseIp: string;
  navigateur: string
    ? systemeExploit
    : string
    ? appareil
    : string
    ? succesConnexion
    : boolean;
}
```

## 🔒 Sécurité

### Authentification JWT

Les tokens JWT contiennent :

```json
{
  "userId": 1,
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290,
  "iss": "sibe-user-service"
}
```

### Hachage des mots de passe

- Algorithme : bcrypt
- Rounds : 10 (configurable)
- Validation de la force du mot de passe

### Exigences pour les mots de passe

- Minimum 8 caractères
- Au moins une lettre minuscule
- Au moins une lettre majuscule
- Au moins un chiffre
- Au moins un caractère spécial

### Protection des routes

Les middlewares vérifient :

- La validité du token JWT
- L'état du compte (actif/inactif)
- Les rôles et permissions

## 🧪 Tests

### Utilisation de REST Client (VS Code)

1. Installer l'extension **REST Client**
2. Ouvrir `api.rest`
3. Cliquer sur "Send Request" au-dessus de chaque requête

### Comptes de test

Après le seed, vous disposez de :

```
Admin:
  Email: admin@sibe.com
  Mot de passe: Admin@123

Organisateur:
  Email: organisateur@sibe.com
  Mot de passe: Org@123

Client:
  Email: client@sibe.com
  Mot de passe: Client@123
```

### Exemple de requête

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@sibe.com",
  "motDePasse": "Admin@123"
}
```

## 🚀 Déploiement

### Production

1. **Configurer les variables d'environnement**

```bash
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=secret_production_securise
```

2. **Générer le client Prisma**

```bash
npm run prisma:generate
```

3. **Appliquer les migrations**

```bash
npx prisma migrate deploy
```

4. **Démarrer le service**

```bash
npm start
```

### Docker (optionnel)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

## 📝 Logs & Monitoring

Le service enregistre :

- Toutes les connexions (succès et échecs)
- L'adresse IP, navigateur, OS de chaque connexion
- Les modifications de profil

## 🔄 Intégrations

Ce service peut être intégré avec :

- **API Gateway** : Pour router les requêtes
- **Service de notification** : Pour envoyer des emails
- **Service d'événements** : Pour vérifier les permissions
- **Service de paiement** : Pour associer les paiements aux utilisateurs

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

ISC

## 👨‍💻 Auteur

SIBE Team

## 📞 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**Note:** Ce service fait partie du projet SIBE (Système Intelligent de Billetterie Événementielle) et doit être déployé avec les autres microservices pour un fonctionnement complet.

Ce microservice gère l'ensemble du cycle de vie des utilisateurs :

- Inscription / Connexion sécurisée
- Gestion des rôles (client, organisateur, administrateur)
- Gestion des profils utilisateur
- Historique des connexions
- Authentification JWT

## 🛠️ Stack Technique

- **Node.js** + **Express.js**
- **Prisma ORM** (MySQL)
- **JWT** pour l'authentification
- **bcrypt** pour le hachage des mots de passe
- **express-validator** pour la validation des données

## 📁 Structure du projet

```
user-service/
├── src/
│   ├── app.js              # Configuration Express
│   ├── server.js           # Point d'entrée
│   ├── routes/             # Routes API
│   ├── controllers/        # Contrôleurs
│   ├── services/           # Logique métier
│   ├── middlewares/        # Middlewares (auth, validation)
│   └── utils/              # Utilitaires
├── prisma/
│   └── schema.prisma       # Schéma Prisma
├── .env                    # Variables d'environnement
├── .env.example            # Exemple de configuration
└── package.json
```

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configuration de l'environnement

Copier `.env.example` vers `.env` et configurer les variables :

```env
DATABASE_URL="mysql://user:password@localhost:3306/userdb"
JWT_SECRET="supersecretkey"
PORT=4001
```

### 3. Initialiser la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer les migrations
npm run prisma:migrate
```

### 4. Lancer le service

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

## 📋 Scripts disponibles

- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer en mode développement (nodemon)
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Créer/appliquer les migrations
- `npm run prisma:studio` - Ouvrir Prisma Studio

## 🔌 API Endpoints (à venir)

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Modifier le profil
- `GET /api/users/history` - Historique des connexions

## 📝 Entités principales

1. **Utilisateur** - Informations de base et authentification
2. **Profil** - Informations détaillées de l'utilisateur
3. **Role** - Gestion des rôles et permissions
4. **HistoriqueConnexion** - Traçabilité des connexions

## 🔐 Sécurité

- Mots de passe hachés avec **bcrypt**
- Authentification par **JWT**
- Validation des données avec **express-validator**
- Variables d'environnement sécurisées

## 👨‍💻 Développement

Ce service fait partie de l'architecture microservices SIBE et communique via une API Gateway.

Port par défaut : **4001**
