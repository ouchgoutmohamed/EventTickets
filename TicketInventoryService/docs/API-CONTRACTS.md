# Contrats d'API - Ticket Inventory Service

Ce document décrit les contrats d'API pour le service de gestion des tickets et réservations.

## Base URL

```
http://localhost:8082
```

## Endpoints

### 1. Réserver des tickets - INT-016

**POST** `/tickets/reserve`

Crée une réservation temporaire de tickets pour un événement. La réservation expire après 15 minutes si elle n'est pas confirmée.

#### Requête

**Headers**:
```
Content-Type: application/json
```

**Body** (`ReserveRequest`):
```json
{
  "eventId": 1,
  "userId": 42,
  "quantity": 2
}
```

**Contraintes de validation**:
- `eventId`: obligatoire, entier positif
- `userId`: obligatoire, entier positif
- `quantity`: obligatoire, entier positif, max 10

#### Réponse

**Status**: `200 OK`

**Body** (`ReserveResponse`):
```json
{
  "reservationId": 123,
  "status": "PENDING",
  "holdExpiresAt": "2025-11-07T15:30:00Z"
}
```

#### Erreurs possibles

- `400 Bad Request`: Validation échouée
- `404 Not Found`: Événement inexistant (TODO)
- `409 Conflict`: Stock insuffisant (TODO)

---

### 2. Confirmer une réservation - INT-017

**POST** `/tickets/confirm`

Confirme une réservation en attente et génère les tickets correspondants.

#### Requête

**Headers**:
```
Content-Type: application/json
```

**Body** (`ConfirmRequest`):
```json
{
  "reservationId": 123
}
```

**Contraintes de validation**:
- `reservationId`: obligatoire, entier positif

#### Réponse

**Status**: `200 OK`

**Body** (`ConfirmResponse`):
```json
{
  "status": "CONFIRMED"
}
```

#### Erreurs possibles

- `400 Bad Request`: Validation échouée
- `404 Not Found`: Réservation inexistante (TODO)
- `409 Conflict`: Réservation expirée ou déjà confirmée (TODO)

---

### 3. Libérer une réservation - INT-018

**POST** `/tickets/release`

Annule une réservation et libère les tickets réservés.

#### Requête

**Headers**:
```
Content-Type: application/json
```

**Body** (`ReleaseRequest`):
```json
{
  "reservationId": 123
}
```

**Contraintes de validation**:
- `reservationId`: obligatoire, entier positif

#### Réponse

**Status**: `200 OK`

**Body** (`ReleaseResponse`):
```json
{
  "status": "CANCELED"
}
```

#### Erreurs possibles

- `400 Bad Request`: Validation échouée
- `404 Not Found`: Réservation inexistante (TODO)
- `409 Conflict`: Réservation déjà annulée (TODO)

---

### 4. Consulter la disponibilité - INT-019

**GET** `/tickets/availability/{eventId}`

Retourne les informations de disponibilité des tickets pour un événement.

#### Paramètres

- `eventId` (path): Identifiant de l'événement

#### Réponse

**Status**: `200 OK`

**Body** (`AvailabilityResponse`):
```json
{
  "eventId": 1,
  "total": 100,
  "available": 98
}
```

**Calcul**: `available = total - reserved`

#### Erreurs possibles

- `404 Not Found`: Événement inexistant (TODO)

---

### 5. Lister les réservations d'un utilisateur - INT-020

**GET** `/tickets/user/{userId}`

Retourne toutes les réservations d'un utilisateur (tous statuts confondus).

#### Paramètres

- `userId` (path): Identifiant de l'utilisateur

#### Réponse

**Status**: `200 OK`

**Body** (`UserReservationsResponse`):
```json
{
  "items": [
    {
      "reservationId": 123,
      "eventId": 1,
      "quantity": 2,
      "status": "CONFIRMED",
      "createdAt": "2025-11-07T12:00:00Z",
      "updatedAt": "2025-11-07T13:00:00Z"
    },
    {
      "reservationId": 124,
      "eventId": 2,
      "quantity": 1,
      "status": "PENDING",
      "createdAt": "2025-11-07T14:55:00Z",
      "updatedAt": "2025-11-07T14:55:00Z"
    },
    {
      "reservationId": 125,
      "eventId": 3,
      "quantity": 4,
      "status": "CANCELED",
      "createdAt": "2025-11-06T10:00:00Z",
      "updatedAt": "2025-11-06T11:00:00Z"
    },
    {
      "reservationId": 126,
      "eventId": 1,
      "quantity": 3,
      "status": "EXPIRED",
      "createdAt": "2025-11-05T08:00:00Z",
      "updatedAt": "2025-11-05T08:15:00Z"
    }
  ]
}
```

---

## Modèle de données

### Statuts de réservation (`ReservationStatus`)

| Statut     | Description                                              |
|------------|----------------------------------------------------------|
| `PENDING`  | Réservation temporaire en attente de confirmation        |
| `CONFIRMED`| Réservation confirmée, tickets émis                      |
| `CANCELED` | Réservation annulée par l'utilisateur ou le système      |
| `EXPIRED`  | Réservation expirée (délai de 15 minutes dépassé)        |

### Règles métier

1. **Réservation temporaire**:
   - Durée de vie: 15 minutes (champ `holdExpiresAt`)
   - Statut initial: `PENDING`
   - Les tickets sont "réservés" mais pas encore émis

2. **Confirmation**:
   - Transformation de `PENDING` → `CONFIRMED`
   - Création d'entités `Ticket`
   - Déclenchement du processus de paiement

3. **Libération/Annulation**:
   - Possible sur réservations `PENDING` ou `CONFIRMED`
   - Libère le stock réservé
   - Si `CONFIRMED`, déclenche un remboursement

4. **Expiration automatique**:
   - Job planifié qui passe les réservations `PENDING` → `EXPIRED`
   - Libère automatiquement le stock
   - TODO: Implémenter avec `@Scheduled`

5. **Verrouillage optimiste**:
   - Utilisation de `@Version` sur l'entité `Inventory`
   - Gestion des conflits de concurrence

---

## Format des erreurs

### Erreur de validation (400)

```json
{
  "timestamp": "2025-11-07T14:30:00Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "Les données de la requête sont invalides",
  "errors": {
    "quantity": "La quantité maximale est de 10 tickets",
    "eventId": "L'identifiant de l'événement est obligatoire"
  }
}
```

### Erreur serveur générique (500)

```json
{
  "timestamp": "2025-11-07T14:30:00Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Une erreur inattendue s'est produite"
}
```

---

## Documentation interactive

Accédez à la documentation Swagger/OpenAPI interactive:

- **Swagger UI**: http://localhost:8082/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8082/api-docs

La documentation Swagger permet de:
- Visualiser tous les endpoints
- Tester les requêtes directement depuis le navigateur
- Consulter les schémas de données
- Voir les exemples de requêtes/réponses

---

## Exemples de tests avec cURL

### Réserver des tickets

```bash
curl -X POST http://localhost:8082/tickets/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "userId": 42,
    "quantity": 2
  }'
```

### Confirmer une réservation

```bash
curl -X POST http://localhost:8082/tickets/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": 123
  }'
```

### Annuler une réservation

```bash
curl -X POST http://localhost:8082/tickets/release \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": 123
  }'
```

### Consulter la disponibilité

```bash
curl http://localhost:8082/tickets/availability/1
```

### Lister les réservations d'un utilisateur

```bash
curl http://localhost:8082/tickets/user/42
```

---

## Notes d'implémentation

### État actuel

✅ **Implémenté**:
- Contrats d'API complets avec validation
- Documentation OpenAPI/Swagger
- Gestion des erreurs de validation
- Réponses simulées (stubs) cohérentes

🚧 **TODO**:
- Implémentation de la couche Repository
- Implémentation de la couche Service
- Logique métier (vérifications, transactions)
- Intégrations avec les autres microservices
- Gestion de l'idempotence
- Job d'expiration automatique
- Tests unitaires et d'intégration

### Prochaines étapes

1. Créer les interfaces Repository (JPA)
2. Implémenter la couche Service avec la logique métier
3. Ajouter la gestion des exceptions métier
4. Implémenter les communications inter-services
5. Ajouter la sécurité (JWT/OAuth2)
6. Écrire les tests
