# Ticket Inventory Service

Microservice Spring Boot 3 (Java 17+) pour la gestion des inventaires de tickets et des réservations d'événements.

## 🎯 Fonctionnalités

Ce service expose une API REST pour :

- **INT-016** : Réservation de tickets pour un événement (avec hold temporaire de 15 min)
- **INT-017** : Confirmation d'une réservation (génération des tickets)
- **INT-018** : Libération/annulation d'une réservation
- **INT-019** : Consultation de la disponibilité des tickets
- **INT-020** : Consultation des réservations d'un utilisateur

### Fonctionnalités avancées

- ✅ **Initialisation paresseuse** : L'inventaire est créé automatiquement lors de la première réservation en récupérant les infos depuis EventCatalogService
- ✅ **Idempotence** : Support des clés d'idempotence pour éviter les doublons de réservation
- ✅ **Verrouillage optimiste** : Gestion des accès concurrents avec @Version
- ✅ **Expiration automatique** : Les réservations PENDING expirent après 15 minutes
- ✅ **Limites par catégorie** : Possibilité de configurer des limites de tickets par catégorie d'événement

## 🏗️ Architecture

### Modèle de domaine

#### Entités JPA

1. **Inventory** (`inventory`)
   - `eventId` (PK) : Identifiant de l'événement
   - `total` : Nombre total de tickets
   - `reserved` : Nombre de tickets réservés
   - `version` : Version pour verrouillage optimiste
   - `updatedAt` : Date de mise à jour
   - Méthode calculée : `getAvailable()` retourne `total - reserved`

2. **Reservation** (`reservation`)
   - `id` (PK, auto-généré)
   - `eventId` : Identifiant de l'événement
   - `userId` : Identifiant de l'utilisateur
   - `quantity` : Nombre de tickets réservés
   - `status` : Statut (PENDING, CONFIRMED, CANCELED, EXPIRED)
   - `holdExpiresAt` : Date d'expiration de la réservation temporaire
   - `createdAt` / `updatedAt` : Horodatages
   - `idempotencyKey` : Clé pour éviter les doublons

3. **Ticket** (`ticket`)
   - `id` (PK, auto-généré)
   - `reservationId` : Lien vers la réservation
   - `userId` : Propriétaire du ticket
   - `eventId` : Événement concerné
   - `quantity` : Nombre de tickets
   - `createdAt` : Date de création

### DTOs (Records)

Tous les DTOs sont implémentés sous forme de **Java records** pour garantir l'immuabilité :

- `ReserveRequest` / `ReserveResponse`
- `ConfirmRequest` / `ConfirmResponse`
- `ReleaseRequest` / `ReleaseResponse`
- `AvailabilityResponse`
- `UserReservationsItem` / `UserReservationsResponse`

### Contrôleur REST

**TicketController** (`/inventory`)

| Méthode | Endpoint                  | Description                              |
|---------|---------------------------|------------------------------------------|
| POST    | `/reserve`                | Créer une réservation temporaire         |
| POST    | `/confirm`                | Confirmer une réservation                |
| POST    | `/release`                | Annuler une réservation                  |
| GET     | `/availability/{eventId}` | Consulter la disponibilité               |
| GET     | `/user/{userId}`          | Lister les réservations d'un utilisateur |

## 🚀 Technologies

- **Java 17+**
- **Spring Boot 3.5.7**
- **Spring Data JPA** : Gestion de la persistance
- **Spring Validation** : Validation des DTOs avec annotations Jakarta
- **SpringDoc OpenAPI 3** : Documentation Swagger/OpenAPI
- **MySQL** : Base de données relationnelle
- **Maven** : Gestion des dépendances

## 📦 Dépendances principales

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

## ⚙️ Configuration

Le fichier `application.properties` contient la configuration de base :

```properties
spring.application.name=ticket-inventory-service
server.port=8082

# Base de données
spring.datasource.url=jdbc:mysql://localhost:3306/ticket_inventory
spring.jpa.hibernate.ddl-auto=update

# Documentation API
springdoc.swagger-ui.path=/swagger-ui.html

# Configuration métier
ticket-inventory.reservation-hold-minutes=15
ticket-inventory.max-tickets-per-reservation=10
ticket-inventory.cleanup-cron=0 */5 * * * *

# URL du service EventCatalog (pour l'initialisation paresseuse de l'inventaire)
eventcatalog.service.base-url=${EVENTCATALOG_SERVICE_URL:http://localhost:8080}

# Limites par catégorie (optionnel)
# ticket-inventory.category-max-per-reservation.MUSIC=6
# ticket-inventory.category-max-per-reservation.SPORTS=4
```

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `EVENTCATALOG_SERVICE_URL` | URL du service EventCatalog | `http://localhost:8080` |
| `MYSQL_HOST` | Hôte MySQL | `localhost` |
| `MYSQL_PORT` | Port MySQL | `3306` |
| `MYSQL_DATABASE` | Nom de la base | `ticket_inventory` |

## 🛠️ Installation et démarrage

### Prérequis

- Java 17 ou supérieur
- Maven 3.6+
- MySQL 8.0+
- EventCatalogService en cours d'exécution (port 8080)

### Étapes

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd TicketInventoryService
   ```

2. **Configurer la base de données**
   - Créer une base MySQL nommée `ticket_inventory`
   - Ajuster les credentials dans `application.properties`

3. **Compiler le projet**
   ```bash
   ./mvnw clean install
   ```

4. **Lancer l'application**
   ```bash
   ./mvnw spring-boot:run
   ```

5. **Accéder à la documentation Swagger**
   - URL : http://localhost:8082/swagger-ui.html
   - API Docs JSON : http://localhost:8082/api-docs

## 📝 État du développement

### ✅ Implémenté

- ✅ Entités JPA avec annotations complètes (Inventory, Reservation, Ticket)
- ✅ Repositories avec requêtes personnalisées et verrouillage pessimiste
- ✅ Service métier complet (TicketInventoryService)
- ✅ Contrôleur REST avec tous les endpoints
- ✅ DTOs immutables (records) avec validation Jakarta
- ✅ Documentation OpenAPI/Swagger
- ✅ Gestion des erreurs personnalisées (GlobalExceptionHandler)
- ✅ Initialisation paresseuse de l'inventaire depuis EventCatalogService
- ✅ Support de l'idempotence pour les réservations
- ✅ Verrouillage optimiste avec @Version
- ✅ Limites de tickets par catégorie d'événement
- ✅ Intégration avec EventCatalogService pour récupérer les détails des événements
- ✅ Tests unitaires avec JUnit 5 et Mockito

### 🚧 Évolutions futures

- Job schedulé pour expirer automatiquement les réservations PENDING
- Événements asynchrones (publication/souscription avec Kafka/RabbitMQ)
- Intégration avec le service de paiement pour les remboursements
- Cache Redis pour les disponibilités

## 📋 Exemples de requêtes

### Réserver des tickets

```bash
POST http://localhost:8082/inventory/reserve
Content-Type: application/json
X-Idempotency-Key: unique-key-123

{
  "eventId": 1,
  "userId": 42,
  "quantity": 2
}
```

**Réponse :**
```json
{
  "reservationId": 123,
  "status": "PENDING",
  "holdExpiresAt": "2025-12-02T22:00:00Z"
}
```

### Confirmer une réservation

```bash
POST http://localhost:8082/inventory/confirm
Content-Type: application/json

{
  "reservationId": 123
}
```

**Réponse :**
```json
{
  "status": "CONFIRMED"
}
```

### Annuler une réservation

```bash
POST http://localhost:8082/inventory/release
Content-Type: application/json

{
  "reservationId": 123
}
```

**Réponse :**
```json
{
  "status": "CANCELED"
}
```

### Consulter la disponibilité

```bash
GET http://localhost:8082/inventory/availability/1
```

**Réponse :**
```json
{
  "eventId": 1,
  "total": 200,
  "available": 198
}
```

### Lister les réservations d'un utilisateur

```bash
GET http://localhost:8082/inventory/user/42
```

**Réponse :**
```json
{
  "items": [
    {
      "reservationId": 123,
      "eventId": 1,
      "quantity": 2,
      "status": "CONFIRMED",
      "createdAt": "2025-12-02T21:45:00Z"
    }
  ]
}
```

## 🏗️ Structure du projet

```
src/main/java/com/acme/tickets/
├── TicketInventoryApplication.java       # Point d'entrée
├── controller/
│   └── TicketController.java             # Contrôleur REST
├── service/
│   └── TicketInventoryService.java       # Logique métier
├── domain/
│   ├── entity/
│   │   ├── Inventory.java                # Entité inventaire
│   │   ├── Reservation.java              # Entité réservation
│   │   └── Ticket.java                   # Entité ticket
│   ├── enums/
│   │   └── ReservationStatus.java        # Enum des statuts
│   └── repository/
│       ├── InventoryRepository.java      # Repository inventaire
│       ├── ReservationRepository.java    # Repository réservation
│       └── TicketRepository.java         # Repository ticket
├── dto/
│   ├── ReserveRequest.java
│   ├── ReserveResponse.java
│   ├── ConfirmRequest.java
│   ├── ConfirmResponse.java
│   ├── ReleaseRequest.java
│   ├── ReleaseResponse.java
│   ├── AvailabilityResponse.java
│   ├── UserReservationsItem.java
│   └── UserReservationsResponse.java
├── integration/
│   └── EventCatalogClient.java           # Client HTTP pour EventCatalog
├── config/
│   ├── OpenApiConfig.java                # Config Swagger
│   └── TicketInventoryProperties.java    # Config métier
└── exception/
    ├── GlobalExceptionHandler.java       # Gestion des erreurs
    ├── InventoryNotFoundException.java
    ├── InsufficientStockException.java
    ├── ReservationNotFoundException.java
    ├── ReservationExpiredException.java
    └── InvalidReservationStateException.java
```

## 🔗 Intégration avec les autres services

### EventCatalogService (port 8080)

Le service récupère automatiquement les informations des événements lors de l'initialisation de l'inventaire :

```
GET http://localhost:8080/events/{eventId}
```

L'inventaire est créé avec le total de tickets calculé à partir des types de billets de l'événement.

### API Gateway (port 3000)

Le service est exposé via l'API Gateway sous le préfixe `/inventory` :

| Endpoint Gateway | Endpoint Service |
|-----------------|------------------|
| `/inventory/reserve` | `/inventory/reserve` |
| `/inventory/confirm` | `/inventory/confirm` |
| `/inventory/release` | `/inventory/release` |
| `/inventory/availability/{id}` | `/inventory/availability/{id}` |
| `/inventory/user/{id}` | `/inventory/user/{id}` |

## 🔒 Sécurité

⚠️ **Note** : La dépendance `spring-boot-starter-security` est incluse avec une configuration basique. Pour un déploiement en production :

- Implémenter l'authentification JWT ou OAuth2
- Protéger les endpoints sensibles
- Valider l'identité des utilisateurs (userId) via le token
- Implémenter les politiques d'autorisation

## 🧪 Tests

Le service inclut des tests unitaires avec JUnit 5 et Mockito :

```bash
# Exécuter les tests
./mvnw test

# Exécuter les tests avec couverture
./mvnw test jacoco:report
```

### Tests disponibles

- `TicketInventoryServiceTest` : Tests du service métier
  - Réservation avec stock suffisant
  - Réservation avec stock insuffisant
  - Idempotence des réservations
  - Confirmation de réservation
  - Consultation de disponibilité
  - Récupération des réservations utilisateur

## 📄 Licence

Apache 2.0

---

**Auteur** : Équipe EventTickets  
**Version** : 1.0.0-SNAPSHOT  
**Date** : Décembre 2025
