# Guide de déploiement - API Gateway

## Ordre de démarrage des services

Pour que l'API Gateway fonctionne correctement, les services backend doivent être démarrés dans l'ordre suivant:

### 1. Base de données MySQL
```bash
# Assurez-vous que MySQL est en cours d'exécution
sudo service mysql start
# ou
docker run -d -p 3306:3306 --name mysql-sibe -e MYSQL_ROOT_PASSWORD=root mysql:8
```

### 2. User Service (Port 3001)
```bash
cd user-service
cp .env.example .env
# Éditer .env avec vos configurations:
# - DATABASE_URL
# - JWT_SECRET (IMPORTANT: doit correspondre à l'API Gateway)
# - JWT_EXPIRES_IN

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Vérifier: `curl http://localhost:3001/health`

### 3. Event Catalog Service (Port 8080)
```bash
cd EventCatalogService
# Configurer application.properties avec les détails de la base de données
./mvnw spring-boot:run
```

Vérifier: `curl http://localhost:8080/actuator/health` ou endpoint approprié

### 4. Ticket Inventory Service (Port 8082)
```bash
cd TicketInventoryService
# Configurer application.yml avec les détails de la base de données
./mvnw spring-boot:run
```

Vérifier: `curl http://localhost:8082/actuator/health` ou endpoint approprié

### 5. Payment and Notification Service (Port 8083)
```bash
cd paymentAndNotificationService
cp .env.example .env
# Configurer .env avec les détails de la base de données et des services

composer install
php artisan migrate
php artisan serve --port=8083
```

Vérifier: `curl http://localhost:8083/api/v1/health` ou endpoint approprié

### 6. API Gateway (Port 3000)
```bash
cd api-gateway
cp .env.example .env
# IMPORTANT: Configurer JWT_SECRET identique au user-service
# Configurer les URLs des services backend

npm install
npm run dev
```

Vérifier: `curl http://localhost:3000/health`

### 7. Frontend (Port 5173)
```bash
cd frontend
cp .env.example .env
# Configurer VITE_API_BASE_URL=http://localhost:3000

npm install
npm run dev
```

## Configuration critique

### Variables d'environnement API Gateway

**Fichier**: `api-gateway/.env`

```env
# Port du serveur
PORT=3000

# CRITIQUE: Doit être identique au user-service
JWT_SECRET=votre-secret-tres-complexe-et-unique

# URLs des services backend
USER_SERVICE_URL=http://localhost:3001
EVENT_CATALOG_SERVICE_URL=http://localhost:8080
TICKET_INVENTORY_SERVICE_URL=http://localhost:8082
PAYMENT_SERVICE_URL=http://localhost:8083

# CORS - Autoriser le frontend
CORS_ORIGIN=http://localhost:5173

# Environnement
NODE_ENV=development
```

### Synchronisation des secrets JWT

**TRÈS IMPORTANT**: Le `JWT_SECRET` doit être identique dans:
- `api-gateway/.env`
- `user-service/.env`

Si ces secrets ne correspondent pas, toutes les requêtes authentifiées échoueront avec une erreur 401.

## Vérification du déploiement

### Script de test complet

```bash
#!/bin/bash

echo "Test de tous les services..."

# 1. User Service
echo -n "User Service: "
curl -s http://localhost:3001/health | grep -q "OK" && echo "✅ OK" || echo "❌ FAILED"

# 2. Event Catalog Service
echo -n "Event Catalog: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|404" && echo "✅ OK" || echo "❌ FAILED"

# 3. Ticket Inventory Service
echo -n "Ticket Inventory: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8082 | grep -q "200\|404" && echo "✅ OK" || echo "❌ FAILED"

# 4. Payment Service
echo -n "Payment Service: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8083 | grep -q "200\|404" && echo "✅ OK" || echo "❌ FAILED"

# 5. API Gateway
echo -n "API Gateway: "
curl -s http://localhost:3000/health | grep -q "OK" && echo "✅ OK" || echo "❌ FAILED"

# 6. Test d'authentification
echo -n "Auth Flow: "
RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","motDePasse":"password"}')
echo $RESPONSE | grep -q "token" && echo "✅ OK" || echo "⚠️  CHECK (may be normal if user doesn't exist)"
```

### Tests manuels

1. **Test route publique (sans token)**
```bash
curl http://localhost:3000/events
```
Attendu: Liste des événements ou erreur 503 si le service n'est pas disponible

2. **Test route protégée sans token**
```bash
curl http://localhost:3000/inventory/reservations
```
Attendu: `{"success": false, "message": "Token d'authentification manquant"}`

3. **Test route protégée avec token invalide**
```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/inventory/reservations
```
Attendu: `{"success": false, "message": "Token invalide"}`

4. **Test avec token valide**
```bash
# D'abord, se connecter pour obtenir un token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sibe.com","motDePasse":"Admin123!"}' | jq -r '.token')

# Ensuite, utiliser le token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/inventory/reservations
```
Attendu: Réponse du service ou erreur 503 si le service n'est pas disponible

## Dépannage

### Problème: "Service temporairement indisponible" (503)

**Cause**: Le service backend n'est pas en cours d'exécution ou n'est pas accessible.

**Solution**:
1. Vérifier que le service backend est démarré
2. Vérifier que le port du service correspond à la configuration dans `.env`
3. Vérifier les logs du service backend

### Problème: "Token invalide" (401) avec un token valide

**Cause**: Le `JWT_SECRET` ne correspond pas entre l'API Gateway et le User Service.

**Solution**:
1. Comparer `JWT_SECRET` dans `api-gateway/.env` et `user-service/.env`
2. S'assurer qu'ils sont identiques
3. Redémarrer les deux services après modification

### Problème: Erreur CORS

**Cause**: L'origine du frontend n'est pas dans la liste des origines autorisées.

**Solution**:
1. Vérifier `CORS_ORIGIN` dans `api-gateway/.env`
2. Ajouter l'URL du frontend (ex: `http://localhost:5173`)
3. Redémarrer l'API Gateway

### Problème: Routes non trouvées (404)

**Cause**: Le chemin de la route ne correspond pas aux routes configurées.

**Solution**:
1. Vérifier que l'URL commence par l'un des préfixes configurés: `/auth`, `/users`, `/events`, `/inventory`, `/payments`
2. Consulter la documentation des routes dans README.md

## Logs et monitoring

### Voir les logs de l'API Gateway

En mode développement:
```bash
cd api-gateway
npm run dev
```
Les logs s'affichent directement dans la console.

### Format des logs

```
[2025-11-23T15:00:00.000Z] GET /events - User: anonymous
[2025-11-23T15:00:00.010Z] GET /events - Status: 200 - Duration: 10ms
```

- Timestamp ISO 8601
- Méthode HTTP et URL
- ID utilisateur (ou "anonymous")
- Code de statut HTTP
- Durée de traitement

## Production

### Recommandations pour la production

1. **Variables d'environnement**
   - Utiliser des secrets forts et uniques pour `JWT_SECRET`
   - Ne jamais commiter les fichiers `.env`
   - Utiliser un gestionnaire de secrets (HashiCorp Vault, AWS Secrets Manager, etc.)

2. **HTTPS**
   - Configurer un reverse proxy (Nginx, Traefik) avec SSL/TLS
   - Forcer HTTPS pour toutes les requêtes

3. **Rate Limiting**
   - Implémenter express-rate-limit (voir SECURITY.md)
   - Configurer des limites appropriées par route

4. **Monitoring**
   - Configurer des alertes pour les erreurs 5xx
   - Monitorer les tentatives d'authentification échouées
   - Surveiller les temps de réponse

5. **Haute disponibilité**
   - Déployer plusieurs instances de l'API Gateway
   - Utiliser un load balancer (HAProxy, AWS ELB, etc.)
   - Implémenter des health checks

6. **Logging**
   - Utiliser un système de logging centralisé (ELK, Splunk, etc.)
   - Ne jamais logger les tokens ou mots de passe
   - Logger les événements de sécurité importants
