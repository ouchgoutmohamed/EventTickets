# 📋 Prochaines Étapes - Service Utilisateur SIBE

## ✅ Étapes Complétées

1. ✅ Projet Node.js initialisé
2. ✅ Dépendances installées (Express, Prisma, JWT, bcrypt, etc.)
3. ✅ Structure de dossiers créée
4. ✅ Configuration environnement (.env, .env.example)
5. ✅ Prisma initialisé avec MySQL
6. ✅ Serveur Express de base fonctionnel sur le port 4001
7. ✅ Scripts npm configurés (dev, start, prisma:\*)

## 🚀 Prochaines Étapes de Développement

### Étape 1 : Définir le schéma Prisma

Modifier `prisma/schema.prisma` pour ajouter les modèles :

- **User** (Utilisateur)
- **Profile** (Profil)
- **Role** (Rôle)
- **ConnectionHistory** (HistoriqueConnexion)

### Étape 2 : Créer les Utilitaires

Dans `src/utils/` :

- `hash.util.js` - Fonctions pour hasher/vérifier les mots de passe
- `token.util.js` - Générer et vérifier les JWT
- `response.util.js` - Formater les réponses API

### Étape 3 : Créer les Middlewares

Dans `src/middlewares/` :

- `auth.middleware.js` - Vérifier les tokens JWT
- `validation.middleware.js` - Valider les données entrantes
- `error.middleware.js` - Gérer les erreurs globalement
- `role.middleware.js` - Vérifier les permissions

### Étape 4 : Créer les Services (Logique Métier)

Dans `src/services/` :

- `auth.service.js` - Inscription, connexion
- `user.service.js` - CRUD utilisateurs
- `profile.service.js` - Gestion des profils
- `connection.service.js` - Historique des connexions

### Étape 5 : Créer les Contrôleurs

Dans `src/controllers/` :

- `auth.controller.js` - Routes d'authentification
- `user.controller.js` - Routes utilisateurs
- `profile.controller.js` - Routes profils

### Étape 6 : Définir les Routes

Dans `src/routes/` :

- `auth.routes.js` - POST /register, /login, /logout
- `user.routes.js` - GET/PUT/DELETE /users
- `profile.routes.js` - GET/PUT /profile

### Étape 7 : Tests et Validation

- Tester avec Postman/Thunder Client
- Ajouter des tests unitaires (Jest)
- Documenter l'API

## 📊 Architecture Prévue

```
Client
  ↓
[API Gateway] ← (Port 3000)
  ↓
[User Service] ← (Port 4001) ← VOUS ÊTES ICI
  ↓
[MySQL Database]
```

## 🔑 Points Clés à Implémenter

### Sécurité

- ✅ Variables d'environnement
- ⏳ Hachage bcrypt (à implémenter)
- ⏳ JWT tokens (à implémenter)
- ⏳ Validation des entrées (à implémenter)
- ⏳ Middleware d'authentification (à implémenter)

### Fonctionnalités Utilisateur

- ⏳ Inscription avec email unique
- ⏳ Connexion avec JWT
- ⏳ Gestion des rôles (Client, Organisateur, Admin)
- ⏳ CRUD profil utilisateur
- ⏳ Historique des connexions
- ⏳ Désactivation de compte

## 📝 Commandes Utiles

```bash
# Démarrer en mode dev (avec hot-reload)
npm run dev

# Générer le client Prisma après modification du schema
npm run prisma:generate

# Créer une migration après modification du schema
npm run prisma:migrate

# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Démarrer en production
npm start
```

## 🎯 Objectif Final

Un microservice complet permettant de :

1. Gérer l'inscription/connexion sécurisée
2. Attribuer et vérifier des rôles
3. Gérer les profils utilisateurs
4. Tracer les connexions
5. Communiquer avec l'API Gateway

---

**Statut actuel** : ✅ Base du projet prête
**Prochaine étape recommandée** : Définir le schéma Prisma
