# Ticket Inventory Service - Architecture & Conventions

## 📐 Architecture

### Couches

```
┌─────────────────────────────────────┐
│       Controller Layer              │  ← Orchestration REST (SRP)
│   @RestController, @RequestMapping  │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│        Service Layer                │  ← Logique métier
│   @Service, @Transactional          │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│      Repository Layer               │  ← Accès données
│   JpaRepository, @Repository        │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│         Domain Layer                │  ← Entités JPA
│   @Entity, @Table                   │
└─────────────────────────────────────┘
```

### Packages

```
com.acme.tickets/
├── controller/          # Endpoints REST
├── service/             # Logique métier
├── domain/
│   ├── entity/         # Entités JPA
│   ├── enums/          # Énumérations
│   └── repository/     # Repositories Spring Data
├── dto/                # DTOs (records)
├── exception/          # Exceptions métier
└── config/             # Configuration Spring
```

## 🎯 Principes Appliqués

### SOLID

- **SRP**: Contrôleurs = orchestration, Services = logique métier
- **OCP**: Interfaces repository extensibles
- **DIP**: Injection par constructeur (final fields)

### Clean Code

- Records pour DTOs immutables
- Nommage explicite (`ReservationNotFoundException`)
- Constantes extraites (`RESERVATION_HOLD_MINUTES`)
- Logs structurés (SLF4J)

### Spring Boot 3

- Jakarta Validation (`@Valid`, `@NotNull`)
- Injection par constructeur (pas `@Autowired`)
- Configuration YAML
- OpenAPI/Swagger intégré

## 🔒 Concurrence

### Verrouillage Optimiste

```java
@Version
private Integer version;  // Dans Inventory
```

### Verrouillage Pessimiste

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Inventory> findByIdWithLock(Long eventId);
```

## 🔄 Idempotence

Les endpoints POST `/reserve` supportent le header `Idempotency-Key`:

```http
POST /tickets/reserve
Idempotency-Key: uuid-abc-123
```

## ⚠️ TODOs Production

### Critique

- [ ] Implémenter JWT/OAuth2 (voir `SecurityConfig`)
- [ ] Activer rate limiting
- [ ] Utiliser Flyway/Liquibase (remplacer `ddl-auto=update`)
- [ ] Configurer monitoring (Actuator + Prometheus)
- [ ] Implémenter circuit breaker (Resilience4j)

### Recommandé

- [ ] Ajouter cache Redis (disponibilités)
- [ ] Implémenter messaging (événements réservation)
- [ ] Tests d'intégration (@SpringBootTest)
- [ ] Health checks détaillés
- [ ] Métriques métier (réservations/min)

## 🧪 Tests

```bash
# TODO: Ajouter des tests
mvn test
```

### Exemples à couvrir

```java
@SpringBootTest
class TicketInventoryServiceTest {
    // Test concurrence réservations
    // Test expiration automatique
    // Test idempotence
}
```

## 📊 Base de Données

### Tables

- `inventory`: Stock par événement (event_id PK)
- `reservation`: Réservations utilisateurs
- `ticket`: Tickets confirmés

### Indexes

- `idx_reservation_user_id`: Requêtes utilisateur
- `idx_reservation_status`: Nettoyage expirées
- `idx_reservation_idempotency_key`: Idempotence

## 🚀 Démarrage

```bash
# Avec Maven
./mvnw spring-boot:run

# Avec Docker (TODO)
docker-compose up
```

**Swagger UI**: http://localhost:8082/swagger-ui.html

## 🔍 Monitoring

```yaml
# TODO: Activer Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info
```

## 📝 Conventions Code

### Commits

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `refactor:` Refactoring
- `docs:` Documentation
- `test:` Tests

### Pull Requests

- Référencer les issues
- Tests passés
- Code review obligatoire
