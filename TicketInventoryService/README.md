# Ticket Inventory Service

Microservice Spring Boot 3 (Java 17+) pour la gestion des inventaires de tickets et des réservations d'événements.

## 🎯 Fonctionnalités

Ce service expose une API REST pour :

- **INT-016** : Réservation de tickets pour un événement
- **INT-017** : Confirmation d'une réservation
- **INT-018** : Libération/annulation d'une réservation
- **INT-019** : Consultation de la disponibilité des tickets
- **INT-020** : Consultation des réservations d'un utilisateur

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

**TicketController** (`/tickets`)

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

spring.datasource.url=jdbc:mysql://localhost:3306/ticket_inventory
spring.jpa.hibernate.ddl-auto=update

springdoc.swagger-ui.path=/swagger-ui.html
```

## 🛠️ Installation et démarrage

### Prérequis

- Java 17 ou supérieur
- Maven 3.6+
- MySQL 8.0+

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

## 📝 État actuel du développement

### ✅ Implémenté

- ✅ Entités JPA avec annotations complètes
- ✅ DTOs immutables (records) avec validation Jakarta
- ✅ Contrôleur REST avec tous les endpoints
- ✅ Documentation OpenAPI/Swagger
- ✅ Gestion des erreurs de validation (GlobalExceptionHandler)
- ✅ Configuration Maven avec toutes les dépendances

### 🚧 À implémenter (TODO)

Les méthodes du contrôleur retournent actuellement des **réponses simulées** (stubs). Voici ce qui reste à implémenter :

#### Couche Repository
```java
// À créer dans com.acme.tickets.repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> { }
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
    Optional<Reservation> findByIdempotencyKey(String key);
}
public interface TicketRepository extends JpaRepository<Ticket, Long> { }
```

#### Couche Service
```java
// À créer dans com.acme.tickets.service
@Service
public class ReservationService {
    // Logique métier pour :
    // - Vérifier la disponibilité du stock
    // - Gérer les réservations avec verrouillage optimiste
    // - Expirer les réservations (job scheduled)
    // - Gérer l'idempotence
}
```

#### Intégrations externes
- Communication avec **EventCatalogService** pour valider les événements
- Communication avec **PaymentService** pour déclencher les paiements
- Gestion des événements asynchrones (publication/souscription)

#### Règles métier à implémenter
- Vérification du stock avant réservation
- Gestion du TTL (15 minutes) des réservations PENDING
- Verrouillage optimiste avec `@Version` sur Inventory
- Validation des transitions de statut
- Gestion des remboursements lors des annulations

## 📋 Exemples de requêtes

### Réserver des tickets

```bash
POST http://localhost:8082/tickets/reserve
Content-Type: application/json

{
  "eventId": 1,
  "userId": 42,
  "quantity": 2
}
```

### Confirmer une réservation

```bash
POST http://localhost:8082/tickets/confirm
Content-Type: application/json

{
  "reservationId": 123
}
```

### Consulter la disponibilité

```bash
GET http://localhost:8082/tickets/availability/1
```

### Lister les réservations d'un utilisateur

```bash
GET http://localhost:8082/tickets/user/42
```

## 🏗️ Structure du projet

```
src/main/java/com/acme/tickets/
├── TicketInventoryApplication.java       # Point d'entrée
├── controller/
│   └── TicketController.java             # Contrôleur REST
├── domain/
│   ├── entity/
│   │   ├── Inventory.java                # Entité inventaire
│   │   ├── Reservation.java              # Entité réservation
│   │   └── Ticket.java                   # Entité ticket
│   └── enums/
│       └── ReservationStatus.java        # Enum des statuts
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
├── config/
│   └── OpenApiConfig.java                # Config Swagger
└── exception/
    └── GlobalExceptionHandler.java       # Gestion des erreurs
```

## 🔒 Sécurité

⚠️ **Note** : La dépendance `spring-boot-starter-security` est incluse mais non configurée. Pour un déploiement en production :

- Implémenter l'authentification JWT ou OAuth2
- Protéger les endpoints sensibles
- Valider l'identité des utilisateurs (userId) via le token
- Implémenter les politiques d'autorisation

## 📄 Licence

Apache 2.0

---

**Auteur** : Équipe EventTickets  
**Version** : 1.0.0-SNAPSHOT  
**Date** : Novembre 2025
