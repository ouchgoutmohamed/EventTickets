# Diagrammes - Ticket Inventory Service

## Architecture

```
+-----------------------------------------------------------------+
|                     CLIENT HTTP                                  |
+--------------------------------+--------------------------------+
                                 v
+-----------------------------------------------------------------+
|  CONTROLLER LAYER                                                |
|  TicketController (/inventory)                                   |
|  - POST /reserve, /confirm, /release                             |
|  - GET /availability/{id}, /user/{id}                            |
+--------------------------------+--------------------------------+
                                 v
+-----------------------------------------------------------------+
|  SERVICE LAYER                                                   |
|  TicketInventoryService (logique metier)                         |
|  ReservationCleanupService (scheduled cleanup)                   |
+--------------------------------+--------------------------------+
                                 v
+-----------------------------------------------------------------+
|  REPOSITORY LAYER                                                |
|  InventoryRepository | ReservationRepository | TicketRepo        |
+--------------------------------+--------------------------------+
                                 v
+-----------------------------------------------------------------+
|  DOMAIN LAYER                                                    |
|  Inventory | Reservation | Ticket                                |
+--------------------------------+--------------------------------+
                                 v
+-----------------------------------------------------------------+
|  INTEGRATION LAYER                                               |
|  EventCatalogClient (REST client -> EventCatalogService)         |
+--------------------------------+--------------------------------+
                                 v
+-----------------------------------------------------------------+
|                     DATABASE (MySQL)                             |
+-----------------------------------------------------------------+
```

---

## Flux de Reservation

```
Client              Controller           Service              DB
  |                     |                   |                   |
  |--POST /reserve----->|                   |                   |
  |                     |--reserveTickets()->                   |
  |                     |                   |--check idempotency|
  |                     |                   |--get inventory----|
  |                     |                   |   (PESSIMISTIC)   |
  |                     |                   |--validate stock   |
  |                     |                   |--create reservation
  |                     |                   |--update inventory |
  |                     |<--ReserveResponse-|                   |
  |<--200 OK {id,status}|                   |                   |
```

---

## Gestion Concurrence

```
User A                User B              Service              DB
  |                     |                   |                   |
  |--Reserve 5--------->|                   |                   |
  |                     |--Reserve 3------->|                   |
  |                     |                   |--LOCK inventory-->|
  |                     |                   |<--Inventory(10,0)-|
  |                     |                   |--save(reserved=5)>|
  |<--OK----------------|                   |                   |
  |                     |                   |--WAIT for lock--->|
  |                     |                   |<--Inventory(10,5)-|
  |                     |                   |--save(reserved=8)>|
  |                     |<--OK--------------|                   |

PESSIMISTIC_WRITE -> Pas d'overbooking
```

---

## Modele de Donnees

```
+---------------------+
|     INVENTORY       |
+---------------------+
| event_id (PK)       |
| total               |
| reserved            |
| version             |
+---------------------+
         |
         v
+---------------------+      +---------------------+
|   RESERVATION       |      |      TICKET         |
+---------------------+      +---------------------+
| id (PK)             |----->| id (PK)             |
| event_id            |      | reservation_id      |
| user_id             |      | user_id             |
| quantity            |      | event_id            |
| status (enum)       |      | quantity            |
| hold_expires_at     |      | created_at          |
| idempotency_key     |      +---------------------+
+---------------------+
```

---

## Structure Packages

```
com.acme.tickets/
  controller/TicketController.java
  service/
    TicketInventoryService.java
    ReservationCleanupService.java
  domain/
    entity/{Inventory,Reservation,Ticket}.java
    enums/ReservationStatus.java
    repository/{*}Repository.java
  dto/{*}Request.java, {*}Response.java
  exception/{*}Exception.java
  config/{OpenApi,Security,Properties}Config.java
  integration/EventCatalogClient.java
```

---

## Tests

```
src/test/java/
  controller/
    TicketControllerIntegrationTest.java  # @SpringBootTest
  service/
    TicketInventoryServiceTest.java       # Unit tests
    ReservationUseCasesTest.java          # Use cases
    ReservationLifecycleTest.java         # Confirm/Release
    ReservationExpirationTest.java        # Expiration logic
  TicketInventoryServiceApplicationTests.java
```

### Couverture

```bash
mvn verify
# HTML: target/site/jacoco/index.html
# XML:  target/site/jacoco/jacoco.xml (SonarQube)
```

---

## Integrations Externes

```
+---------------------+       +---------------------+
| TicketInventory     |------>| EventCatalogService |
| Service (8082)      | REST  | (8080)              |
+---------------------+       +---------------------+
         |
         v
+---------------------+
|   API Gateway       |
|   (3000)            |
+---------------------+
```
