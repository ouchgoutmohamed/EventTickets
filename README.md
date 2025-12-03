# EventTickets - Plateforme Microservices

Plateforme de billetterie événementielle basée sur une architecture microservices.

## 🏗️ Architecture

| Service | Technologie | Port | Description |
|---------|-------------|------|-------------|
| `api-gateway` | Node.js, Express | 3000 | Point d'entrée, JWT, routage |
| `EventCatalogService` | Java 17, Spring Boot | 8080 | Catalogue d'événements |
| `TicketInventoryService` | Java 17, Spring Boot | 8082 | Stocks et réservations |
| `paymentAndNotificationService` | PHP 8.2, Laravel | 8083 | Paiements et notifications |
| `user-service` | Node.js, Prisma | 3001 | Authentification, profils |
| `web` | Vue.js, Vite | 5173 | Frontend |

## 🚀 Démarrage rapide

```bash
# API Gateway (démarrer en premier)
cd api-gateway && npm install && npm run dev

# Event Catalog Service
cd EventCatalogService && mvnw.cmd spring-boot:run

# Ticket Inventory Service
cd TicketInventoryService && mvnw.cmd spring-boot:run

# Payment & Notification Service
cd paymentAndNotificationService && composer install && php artisan serve

# User Service
cd user-service && npm install && npm run dev

# Frontend
cd web && npm install && npm run dev
```

## 🧪 Tests

| Service | Commande |
|---------|----------|
| EventCatalogService | `mvnw.cmd test` |
| TicketInventoryService | `mvnw.cmd test` |
| paymentAndNotificationService | `php artisan test` |

### Couverture de code (JaCoCo)

```bash
cd TicketInventoryService
mvn verify
# Rapport: target/site/jacoco/index.html
```

### Analyse SonarQube

```bash
cd TicketInventoryService
mvn verify sonar:sonar -Psonar -Dsonar.token=YOUR_TOKEN
```

### Tests de charge (JMeter)

```bash
cd TicketInventoryService/jmeter
jmeter -n -t TicketReservationLoadTest.jmx -l results.jtl
```

## 🐳 Docker

```bash
docker-compose up -d
```

## 📁 Structure

```
EventTickets/
├── api-gateway/                 # API Gateway (Node.js)
├── EventCatalogService/         # Catalogue (Spring Boot)
├── TicketInventoryService/      # Inventaire (Spring Boot)
├── paymentAndNotificationService/  # Paiement (Laravel)
├── user-service/                # Utilisateurs (Node.js)
├── web/                         # Frontend (Vue.js)
└── docker-compose.yml
```

## ⚙️ Configuration

Chaque service nécessite un fichier `.env` (voir `.env.example` dans chaque dossier).

| Service | Variables clés |
|---------|----------------|
| api-gateway | `JWT_SECRET`, URLs des services |
| Spring Boot | `spring.datasource.*` |
| Laravel | `DB_*`, `MAIL_*`, clés paiement |
| user-service | `DATABASE_URL`, `JWT_SECRET` |
| web | `VITE_API_BASE_URL` |

## 📚 Documentation API

- **Swagger UI**: http://localhost:8080/swagger-ui.html (EventCatalog)
- **Swagger UI**: http://localhost:8082/swagger-ui.html (TicketInventory)

