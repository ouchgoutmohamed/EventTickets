# Docker Compose - EventTickets Microservices

Ce projet utilise Docker Compose pour orchestrer tous les microservices de l'application EventTickets.

## Services

- **MySQL**: Base de données relationnelle (port 3306)
- **User Service**: Gestion des utilisateurs (Node.js - port 3001)
- **Event Catalog Service**: Catalogue d'événements (Spring Boot - port 8080)
- **Ticket Inventory Service**: Gestion des réservations (Spring Boot - port 8082)
- **Payment Service**: Paiements et notifications (Laravel - port 8083)
- **API Gateway**: Point d'entrée unique (Node.js - port 3000)
- **Web Frontend**: Interface utilisateur (React/Vite - port 5173)

## Démarrage rapide

### 1. Prérequis
- Docker Desktop installé
- Docker Compose v2.0+

### 2. Lancer tous les services

```powershell
docker-compose up -d
```

### 3. Vérifier le statut

```powershell
docker-compose ps
```

### 4. Voir les logs

```powershell
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f api-gateway
```

### 5. Arrêter les services

```powershell
docker-compose down
```

### 6. Arrêter et supprimer les volumes

```powershell
docker-compose down -v
```

## Accès aux services

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **User Service**: http://localhost:3001
- **Event Catalog**: http://localhost:8080
- **Ticket Inventory**: http://localhost:8082
- **Payment Service**: http://localhost:8083

## Initialisation de la base de données

Les migrations sont exécutées automatiquement au démarrage des services.

### User Service (Prisma)
```powershell
docker-compose exec user-service npx prisma migrate deploy
docker-compose exec user-service npx prisma db seed
```

### Event Catalog & Inventory (Hibernate)
Les schémas sont créés automatiquement via `spring.jpa.hibernate.ddl-auto=update`

## Rebuild d'un service spécifique

```powershell
docker-compose up -d --build api-gateway
```

## Variables d'environnement

Les variables sont définies dans le fichier `docker-compose.yml`.
Pour la production, utilisez un fichier `.env` :

```env
MYSQL_ROOT_PASSWORD=votre_mot_de_passe_securise
JWT_SECRET=votre_secret_jwt_securise
```

## Troubleshooting

### Service ne démarre pas
```powershell
docker-compose logs nom-du-service
```

### Réinitialiser complètement
```powershell
docker-compose down -v
docker-compose up -d --build
```

### Accéder à un conteneur
```powershell
docker-compose exec api-gateway sh
```

### Vérifier les connexions réseau
```powershell
docker network inspect eventtickets_eventtickets-network
```
