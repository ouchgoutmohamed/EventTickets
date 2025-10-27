# 🎫 SIBE - Service Utilisateur

## Description

Service de gestion des utilisateurs pour le **Système Intelligent de Billetterie Événementielle (SIBE)**.

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
