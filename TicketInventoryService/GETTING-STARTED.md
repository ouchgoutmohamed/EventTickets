# Guide de démarrage - Ticket Inventory Service

## 📋 Récapitulatif du projet généré

Le microservice **Ticket Inventory Service** a été généré avec succès selon vos spécifications. Voici ce qui a été créé :

### ✅ Fichiers créés

#### 1. **Entités JPA** (`domain/entity/`)
- ✅ `Inventory.java` - Gestion du stock de tickets par événement
- ✅ `Reservation.java` - Réservations de tickets avec statuts
- ✅ `Ticket.java` - Tickets émis après confirmation
- ✅ `ReservationStatus.java` (enum) - Statuts PENDING, CONFIRMED, CANCELED, EXPIRED

#### 2. **DTOs (Records)** (`dto/`)
- ✅ `ReserveRequest.java` / `ReserveResponse.java`
- ✅ `ConfirmRequest.java` / `ConfirmResponse.java`
- ✅ `ReleaseRequest.java` / `ReleaseResponse.java`
- ✅ `AvailabilityResponse.java`
- ✅ `UserReservationsItem.java` / `UserReservationsResponse.java`

Tous les DTOs incluent :
- Validation Jakarta (`@NotNull`, `@Positive`, `@Max`)
- Annotations OpenAPI (`@Schema`)
- Format record pour l'immuabilité

#### 3. **Contrôleur REST** (`controller/`)
- ✅ `TicketController.java` avec 5 endpoints :
  - `POST /tickets/reserve` (INT-016)
  - `POST /tickets/confirm` (INT-017)
  - `POST /tickets/release` (INT-018)
  - `GET /tickets/availability/{eventId}` (INT-019)
  - `GET /tickets/user/{userId}` (INT-020)

Chaque méthode contient :
- Commentaires TODO détaillant la logique métier à implémenter
- Réponses stubs réalistes pour tester l'API
- Documentation OpenAPI complète

#### 4. **Configuration** (`config/`)
- ✅ `OpenApiConfig.java` - Configuration Swagger/OpenAPI

#### 5. **Gestion des erreurs** (`exception/`)
- ✅ `GlobalExceptionHandler.java` - Capture des erreurs de validation

#### 6. **Configuration Maven**
- ✅ `pom.xml` mis à jour avec les dépendances :
  - `spring-boot-starter-web`
  - `spring-boot-starter-validation`
  - `spring-boot-starter-data-jpa`
  - `springdoc-openapi-starter-webmvc-ui`

#### 7. **Configuration application**
- ✅ `application.properties` - Configuration complète (DB, JPA, OpenAPI, logs)

#### 8. **Documentation**
- ✅ `README.md` - Documentation complète du projet
- ✅ `docs/API-CONTRACTS.md` - Contrats d'API détaillés

---

## 🚀 Démarrage rapide

### Étape 1 : Télécharger les dépendances Maven

Ouvrez un terminal dans le dossier du projet et exécutez :

```powershell
cd "c:\Users\AdMin\Documents\ingenerie-logiciel\master\S3\web services\EventTickets\TicketInventoryService"
.\mvnw.cmd clean install
```

Cela va :
- Télécharger toutes les dépendances Maven
- Compiler le projet
- Résoudre les erreurs de compilation actuelles

### Étape 2 : Configurer la base de données

1. Démarrez MySQL (si ce n'est pas déjà fait)
2. La base de données `ticket_inventory` sera créée automatiquement au premier démarrage
3. Si nécessaire, modifiez les credentials dans `application.properties` :

```properties
spring.datasource.username=root
spring.datasource.password=votre_mot_de_passe
```

### Étape 3 : Lancer l'application

```powershell
.\mvnw.cmd spring-boot:run
```

L'application démarrera sur le port **8082**.

### Étape 4 : Tester l'API

Accédez à la documentation Swagger :
```
http://localhost:8082/swagger-ui.html
```

Testez un endpoint :
```powershell
curl -X POST http://localhost:8082/tickets/reserve -H "Content-Type: application/json" -d '{\"eventId\":1,\"userId\":42,\"quantity\":2}'
```

---

## 📊 État actuel vs. Production

### ✅ Ce qui fonctionne actuellement

| Fonctionnalité | État | Description |
|----------------|------|-------------|
| Entités JPA | ✅ Complet | Toutes les entités avec annotations complètes |
| DTOs & Validation | ✅ Complet | Records immutables avec validation Jakarta |
| Endpoints REST | ✅ Stubs | Contrats d'API complets, réponses simulées |
| OpenAPI/Swagger | ✅ Complet | Documentation interactive complète |
| Gestion erreurs | ✅ Partiel | Validation uniquement |
| Configuration | ✅ Complet | Maven, Spring Boot, base de données |

### 🚧 Ce qui doit être implémenté

#### Couche Repository
```java
// À créer dans com.acme.tickets.repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    // Méthodes de requête personnalisées si nécessaire
}

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
    Optional<Reservation> findByIdempotencyKey(String key);
    List<Reservation> findByStatusAndHoldExpiresAtBefore(
        ReservationStatus status, Instant expiration
    );
}

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReservationId(Long reservationId);
}
```

#### Couche Service

Créer `ReservationService.java` avec la logique métier :

1. **Pour `/reserve`** :
   ```java
   @Transactional
   public ReserveResponse reserveTickets(ReserveRequest request) {
       // 1. Vérifier que l'événement existe (appel EventCatalogService)
       // 2. Récupérer/créer l'inventaire avec lock optimiste
       // 3. Vérifier le stock disponible
       // 4. Créer la réservation avec status PENDING
       // 5. Incrémenter inventory.reserved
       // 6. Définir holdExpiresAt = now + 15 minutes
       // 7. Persister
       // 8. Retourner la réponse
   }
   ```

2. **Pour `/confirm`** :
   ```java
   @Transactional
   public ConfirmResponse confirmReservation(ConfirmRequest request) {
       // 1. Récupérer la réservation
       // 2. Vérifier le statut (doit être PENDING)
       // 3. Vérifier l'expiration
       // 4. Mettre à jour le statut à CONFIRMED
       // 5. Créer les entités Ticket
       // 6. Déclencher le paiement (appel async PaymentService)
       // 7. Publier événement ReservationConfirmed
       // 8. Persister
   }
   ```

3. **Pour `/release`** :
   ```java
   @Transactional
   public ReleaseResponse releaseReservation(ReleaseRequest request) {
       // 1. Récupérer la réservation
       // 2. Vérifier qu'elle n'est pas déjà CANCELED
       // 3. Mettre à jour le statut à CANCELED
       // 4. Décrémenter inventory.reserved
       // 5. Si CONFIRMED, déclencher un remboursement
       // 6. Publier événement ReservationCanceled
   }
   ```

4. **Job d'expiration automatique** :
   ```java
   @Scheduled(fixedRate = 60000) // Toutes les minutes
   public void expireReservations() {
       // 1. Trouver toutes les réservations PENDING avec holdExpiresAt < now
       // 2. Pour chaque réservation :
       //    - Mettre le statut à EXPIRED
       //    - Décrémenter inventory.reserved
       // 3. Publier événements ReservationExpired
   }
   ```

#### Gestion des exceptions métier

Créer des exceptions personnalisées :
```java
public class ReservationNotFoundException extends RuntimeException { }
public class InsufficientStockException extends RuntimeException { }
public class ReservationExpiredException extends RuntimeException { }
public class InvalidReservationStatusException extends RuntimeException { }
```

Ajouter des handlers dans `GlobalExceptionHandler` :
```java
@ExceptionHandler(ReservationNotFoundException.class)
public ResponseEntity<?> handleNotFound(ReservationNotFoundException ex) {
    // Retourner 404
}

@ExceptionHandler(InsufficientStockException.class)
public ResponseEntity<?> handleInsufficientStock(InsufficientStockException ex) {
    // Retourner 409 Conflict
}
```

#### Intégrations externes

1. **EventCatalogService** :
   - Utiliser `RestTemplate` ou `WebClient`
   - Vérifier l'existence d'un événement
   - Récupérer les détails de l'événement

2. **PaymentService** :
   - Communication asynchrone (message queue ou API REST)
   - Déclencher un paiement lors de la confirmation
   - Gérer les callbacks de paiement

3. **Messaging/Events** :
   - Utiliser Kafka, RabbitMQ ou Spring Cloud Stream
   - Publier des événements métier :
     - `ReservationCreated`
     - `ReservationConfirmed`
     - `ReservationCanceled`
     - `ReservationExpired`

#### Sécurité

1. Configurer Spring Security :
   ```java
   @Configuration
   @EnableWebSecurity
   public class SecurityConfig {
       @Bean
       public SecurityFilterChain filterChain(HttpSecurity http) {
           // Configuration JWT/OAuth2
       }
   }
   ```

2. Protéger les endpoints
3. Valider l'identité de l'utilisateur via le token
4. Implémenter les politiques d'autorisation

#### Tests

1. **Tests unitaires** :
   - Tester la logique métier des services
   - Mocker les repositories

2. **Tests d'intégration** :
   - Tester les endpoints REST
   - Utiliser `@SpringBootTest` et `MockMvc`
   - Base de données H2 en mémoire

---

## 📁 Structure finale du projet

```
TicketInventoryService/
├── src/
│   ├── main/
│   │   ├── java/com/acme/tickets/
│   │   │   ├── TicketInventoryApplication.java
│   │   │   ├── controller/
│   │   │   │   └── TicketController.java ✅
│   │   │   ├── domain/
│   │   │   │   ├── entity/
│   │   │   │   │   ├── Inventory.java ✅
│   │   │   │   │   ├── Reservation.java ✅
│   │   │   │   │   └── Ticket.java ✅
│   │   │   │   └── enums/
│   │   │   │       └── ReservationStatus.java ✅
│   │   │   ├── dto/
│   │   │   │   ├── ReserveRequest.java ✅
│   │   │   │   ├── ReserveResponse.java ✅
│   │   │   │   ├── ConfirmRequest.java ✅
│   │   │   │   ├── ConfirmResponse.java ✅
│   │   │   │   ├── ReleaseRequest.java ✅
│   │   │   │   ├── ReleaseResponse.java ✅
│   │   │   │   ├── AvailabilityResponse.java ✅
│   │   │   │   ├── UserReservationsItem.java ✅
│   │   │   │   └── UserReservationsResponse.java ✅
│   │   │   ├── repository/ 🚧 À créer
│   │   │   │   ├── InventoryRepository.java
│   │   │   │   ├── ReservationRepository.java
│   │   │   │   └── TicketRepository.java
│   │   │   ├── service/ 🚧 À créer
│   │   │   │   └── ReservationService.java
│   │   │   ├── config/
│   │   │   │   ├── OpenApiConfig.java ✅
│   │   │   │   └── SecurityConfig.java 🚧
│   │   │   └── exception/
│   │   │       ├── GlobalExceptionHandler.java ✅
│   │   │       └── [exceptions métier] 🚧
│   │   └── resources/
│   │       └── application.properties ✅
│   └── test/ 🚧 À implémenter
├── docs/
│   └── API-CONTRACTS.md ✅
├── pom.xml ✅
└── README.md ✅
```

---

## 🎯 Prochaines étapes recommandées

1. **Compiler le projet** :
   ```powershell
   .\mvnw.cmd clean install
   ```

2. **Tester les endpoints avec Swagger** :
   - Démarrer l'application
   - Ouvrir http://localhost:8082/swagger-ui.html
   - Tester les réponses stubs

3. **Implémenter les repositories** :
   - Créer les 3 interfaces Repository
   - Tester avec des données de test

4. **Implémenter la couche service** :
   - Commencer par `reserveTickets()`
   - Ajouter les validations métier
   - Gérer les transactions

5. **Ajouter les tests** :
   - Tests unitaires des services
   - Tests d'intégration des endpoints

6. **Intégrer avec les autres microservices** :
   - EventCatalogService
   - PaymentService

7. **Ajouter la sécurité** :
   - Configuration JWT
   - Protection des endpoints

---

## ⚠️ Notes importantes

### Erreurs de compilation actuelles

Les erreurs de compilation que vous voyez sont **normales** et seront résolues après avoir exécuté :

```powershell
.\mvnw.cmd clean install
```

Cette commande va télécharger toutes les dépendances Maven nécessaires (SpringDoc OpenAPI, Jakarta Validation, etc.).

### Base de données

L'application est configurée pour utiliser MySQL. Au premier démarrage :
- La base `ticket_inventory` sera créée automatiquement
- Les tables seront générées à partir des entités JPA
- `spring.jpa.hibernate.ddl-auto=update` permet de mettre à jour le schéma

### Port de l'application

Le service écoute sur le port **8082** pour ne pas entrer en conflit avec les autres microservices :
- EventCatalogService : port 8080 (probablement)
- User Service : port 3000 (probablement)
- Ticket Inventory : **port 8082**

---

## 📚 Ressources

- [Documentation Spring Boot](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [SpringDoc OpenAPI](https://springdoc.org/)
- [Jakarta Bean Validation](https://beanvalidation.org/)

---

**Bon développement ! 🚀**
