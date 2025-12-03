# Ticket Inventory Service - Architecture

## 📐 Architecture en Couches

```
┌───────────────────────────────────────┐
│       Controller (@RestController)    │ ← REST API
├───────────────────────────────────────┤
│       Service (@Service)              │ ← Logique métier
├───────────────────────────────────────┤
│       Repository (JpaRepository)      │ ← Accès données
├───────────────────────────────────────┤
│       Domain (@Entity)                │ ← Entités JPA
├───────────────────────────────────────┤
│       Integration (RestClient)        │ ← Services externes
└───────────────────────────────────────┘
```

## 📁 Structure des Packages

```
com.acme.tickets/
├── controller/      # Endpoints REST
├── service/         # Logique métier
├── domain/
│   ├── entity/     # Inventory, Reservation, Ticket
│   ├── enums/      # ReservationStatus
│   └── repository/ # JPA Repositories
├── dto/            # Records (Request/Response)
├── exception/      # Exceptions métier
├── config/         # Configuration Spring
└── integration/    # EventCatalogClient
```

## 🎯 Principes SOLID

| Principe | Application |
|----------|-------------|
| **SRP** | Controller = orchestration, Service = métier |
| **OCP** | Interfaces repository extensibles |
| **DIP** | Injection constructeur (final fields) |

## 🔒 Gestion de la Concurrence

### Verrouillage Optimiste
```java
@Version
private Integer version;  // Inventory
```

### Verrouillage Pessimiste
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Inventory> findByEventIdWithLock(Long eventId);
```

## 🔄 Idempotence

Header `X-Idempotency-Key` pour éviter les doublons de réservation.

## 🧪 Tests

| Type | Outil | Commande |
|------|-------|----------|
| Unitaires | JUnit 5, Mockito | `mvn test` |
| Intégration | @SpringBootTest | `mvn verify` |
| Couverture | JaCoCo | `target/site/jacoco/` |
| Qualité | SonarQube | `mvn sonar:sonar` |
| Charge | JMeter | `jmeter/*.jmx` |

## 📊 Base de Données

| Table | Description |
|-------|-------------|
| `inventory` | Stock par événement (event_id PK) |
| `reservation` | Réservations utilisateurs |
| `ticket` | Tickets confirmés |

### Index
- `idx_reservation_user_id`
- `idx_reservation_status`
- `idx_reservation_idempotency_key`

## 🚀 Démarrage

```bash
# Maven
mvn spring-boot:run

# Docker
docker-compose up
```

## ⚠️ TODOs Production

- [ ] JWT/OAuth2 authentication
- [ ] Rate limiting
- [ ] Flyway migrations
- [ ] Circuit breaker (Resilience4j)
- [ ] Cache Redis
- [ ] Messaging (Kafka/RabbitMQ)


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
