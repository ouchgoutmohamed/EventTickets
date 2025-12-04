# Ticket Inventory Service

Microservice Spring Boot 3 pour la gestion des réservations de tickets d'événements.

## 🚀 Stack Technique

| Technologie | Version |
|-------------|---------|
| Java | 17 |
| Spring Boot | 3.5.7 |
| MySQL | 8.0+ |
| Maven | 3.6+ |
| JaCoCo | 0.8.11 |

## 📋 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/inventory/reserve` | Réserver des tickets |
| POST | `/inventory/confirm` | Confirmer une réservation |
| POST | `/inventory/release` | Annuler une réservation |
| GET | `/inventory/availability/{eventId}` | Consulter disponibilité |
| GET | `/inventory/user/{userId}` | Réservations utilisateur |

## 🏃 Démarrage rapide

```bash
# Compiler
mvn clean install

# Lancer
mvn spring-boot:run

# Swagger UI
http://localhost:8082/swagger-ui.html
```

## 🧪 Tests

```bash
# Tests unitaires + intégration
mvn test

# Tests avec couverture JaCoCo
mvn verify

# Rapport HTML: target/site/jacoco/index.html
```

## 📊 Qualité du Code

### SonarQube

```bash
# Analyse SonarQube
mvn verify sonar:sonar -Psonar -Dsonar.token=YOUR_TOKEN
```

Configuration: `sonar-project.properties`

### JMeter (Tests de charge)

Les plans de test JMeter sont dans `jmeter/`:
- `TicketReservationLoadTest.jmx`

```bash
jmeter -n -t jmeter/TicketReservationLoadTest.jmx -l results.jtl
```

## 📁 Structure du Projet

```
src/
├── main/java/com/acme/tickets/
│   ├── controller/     # REST Controllers
│   ├── service/        # Business Logic
│   ├── domain/         # Entities & Repositories
│   ├── dto/            # Request/Response DTOs
│   ├── config/         # Configuration
│   └── integration/    # External Service Clients
└── test/java/          # Unit & Integration Tests
```

## ⚙️ Configuration

Variables d'environnement principales:

| Variable | Description | Défaut |
|----------|-------------|--------|
| `EVENTCATALOG_SERVICE_URL` | URL EventCatalog | `http://localhost:8080` |
| `MYSQL_HOST` | Hôte MySQL | `localhost` |
| `MYSQL_DATABASE` | Base de données | `ticket_inventory` |

## 🔗 Liens

- **Swagger UI**: http://localhost:8082/swagger-ui.html
- **API Docs**: http://localhost:8082/api-docs

