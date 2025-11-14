# 🧪 Guide de Test - Ticket Inventory Service avec Postman

## 📋 Informations du Service

- **URL de base** : `http://localhost:8082`
- **Swagger UI** : `http://localhost:8082/swagger-ui.html`
- **API Docs** : `http://localhost:8082/api-docs`

---

## 🎯 Endpoints Disponibles

### 1. **INT-019 : Consulter la disponibilité**
- **Méthode** : `GET`
- **URL** : `http://localhost:8082/tickets/availability/{eventId}`
- **Description** : Récupère la disponibilité des tickets pour un événement

### 2. **INT-016 : Réserver des tickets**
- **Méthode** : `POST`
- **URL** : `http://localhost:8082/tickets/reserve`
- **Description** : Crée une réservation temporaire (expire en 15 min)

### 3. **INT-017 : Confirmer une réservation**
- **Méthode** : `POST`
- **URL** : `http://localhost:8082/tickets/confirm`
- **Description** : Confirme une réservation en attente

### 4. **INT-018 : Libérer/Annuler une réservation**
- **Méthode** : `POST`
- **URL** : `http://localhost:8082/tickets/release`
- **Description** : Annule une réservation et libère les tickets

### 5. **INT-020 : Réservations d'un utilisateur**
- **Méthode** : `GET`
- **URL** : `http://localhost:8082/tickets/user/{userId}`
- **Description** : Liste toutes les réservations d'un utilisateur

---

## 🚀 Scénario de Test Complet

### ÉTAPE 0 : Préparer les données (via SQL ou API Event Catalog)

Avant de tester, vous devez avoir un inventaire dans la base de données :

```sql
-- Se connecter à la base de données
USE eventtickets_inventory;

-- Créer un inventaire pour un événement (par exemple eventId = 1)
INSERT INTO inventory (event_id, total, reserved, version, updated_at) 
VALUES (1, 100, 0, 0, NOW());

-- Vérifier
SELECT * FROM inventory;
```

---

### ✅ TEST 1 : Vérifier la disponibilité

**Request :**
```
GET http://localhost:8082/tickets/availability/1
```

**Headers :**
```
Content-Type: application/json
```

**Réponse attendue :**
```json
{
  "eventId": 1,
  "total": 100,
  "reserved": 0,
  "available": 100
}
```

---

### ✅ TEST 2 : Réserver des tickets

**Request :**
```
POST http://localhost:8082/tickets/reserve
```

**Headers :**
```
Content-Type: application/json
Idempotency-Key: test-reservation-001
```

**Body (JSON) :**
```json
{
  "eventId": 1,
  "userId": 1,
  "quantity": 3
}
```

**Réponse attendue :**
```json
{
  "reservationId": 1,
  "status": "PENDING",
  "expiresAt": "2025-11-07T15:30:00Z",
  "message": "Réservation créée avec succès. Vous avez 15 minutes pour confirmer."
}
```

**Notes :**
- Conservez le `reservationId` pour les tests suivants
- La réservation expire automatiquement après 15 minutes

---

### ✅ TEST 3 : Vérifier que la disponibilité a changé

**Request :**
```
GET http://localhost:8082/tickets/availability/1
```

**Réponse attendue :**
```json
{
  "eventId": 1,
  "total": 100,
  "reserved": 3,
  "available": 97
}
```

---

### ✅ TEST 4 : Consulter les réservations de l'utilisateur

**Request :**
```
GET http://localhost:8082/tickets/user/1
```

**Réponse attendue :**
```json
{
  "userId": 1,
  "reservations": [
    {
      "reservationId": 1,
      "eventId": 1,
      "quantity": 3,
      "status": "PENDING",
      "holdExpiresAt": "2025-11-07T15:30:00Z",
      "createdAt": "2025-11-07T15:15:00Z"
    }
  ]
}
```

---

### ✅ TEST 5 : Confirmer la réservation

**Request :**
```
POST http://localhost:8082/tickets/confirm
```

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "reservationId": 1
}
```

**Réponse attendue :**
```json
{
  "reservationId": 1,
  "status": "CONFIRMED",
  "message": "Réservation confirmée avec succès."
}
```

---

### ✅ TEST 6 (Alternative) : Annuler une réservation

**Si vous voulez annuler au lieu de confirmer :**

**Request :**
```
POST http://localhost:8082/tickets/release
```

**Body (JSON) :**
```json
{
  "reservationId": 1
}
```

**Réponse attendue :**
```json
{
  "reservationId": 1,
  "status": "CANCELED",
  "message": "Réservation annulée avec succès."
}
```

---

## 🧪 Tests d'Erreurs

### ❌ TEST 7 : Réserver sans stock suffisant

**Body :**
```json
{
  "eventId": 1,
  "userId": 2,
  "quantity": 200
}
```

**Réponse attendue : 409 Conflict**
```json
{
  "status": 409,
  "error": "INSUFFICIENT_STOCK",
  "message": "Stock insuffisant. Disponible: 97, Demandé: 200"
}
```

---

### ❌ TEST 8 : Confirmer une réservation inexistante

**Body :**
```json
{
  "reservationId": 99999
}
```

**Réponse attendue : 404 Not Found**
```json
{
  "status": 404,
  "error": "RESERVATION_NOT_FOUND",
  "message": "Réservation non trouvée"
}
```

---

### ❌ TEST 9 : Vérifier la disponibilité d'un événement sans inventaire

**Request :**
```
GET http://localhost:8082/tickets/availability/9999
```

**Réponse attendue : 404 Not Found**
```json
{
  "status": 404,
  "error": "INVENTORY_NOT_FOUND",
  "message": "Inventaire non trouvé pour l'événement: 9999"
}
```

---

## 🔄 Test de l'Idempotence

### TEST 10 : Réserver avec la même clé d'idempotence

**Première requête :**
```
POST http://localhost:8082/tickets/reserve
Header: Idempotency-Key: unique-key-123

Body:
{
  "eventId": 1,
  "userId": 3,
  "quantity": 2
}
```

**Deuxième requête (identique) :**
```
POST http://localhost:8082/tickets/reserve
Header: Idempotency-Key: unique-key-123

Body:
{
  "eventId": 1,
  "userId": 3,
  "quantity": 2
}
```

**Résultat attendu :**
- Même `reservationId` retourné
- Aucune nouvelle réservation créée
- Stock non déduit deux fois

---

## 📊 Validation des Données

### Vérifier dans la base de données :

```sql
-- Toutes les réservations
SELECT * FROM reservation;

-- État de l'inventaire
SELECT * FROM inventory WHERE event_id = 1;

-- Tickets générés (si la table existe)
SELECT * FROM ticket WHERE event_id = 1;
```

---

## 🎯 Checklist de Test Complet

- [ ] ✅ Disponibilité initiale
- [ ] ✅ Créer une réservation
- [ ] ✅ Vérifier la disponibilité mise à jour
- [ ] ✅ Consulter les réservations utilisateur
- [ ] ✅ Confirmer une réservation
- [ ] ✅ Annuler une réservation
- [ ] ❌ Tester stock insuffisant
- [ ] ❌ Tester réservation inexistante
- [ ] ❌ Tester événement inexistant
- [ ] ✅ Tester l'idempotence
- [ ] ⏱️ Tester l'expiration (attendre 15 minutes)

---

## 🛠️ Commandes Utiles

### Réinitialiser la base de données :
```sql
TRUNCATE TABLE ticket;
TRUNCATE TABLE reservation;
DELETE FROM inventory;

-- Recréer l'inventaire
INSERT INTO inventory (event_id, total, reserved, version, updated_at) 
VALUES (1, 100, 0, 0, NOW());
```

### Vérifier les logs du service :
Consultez la console où le service est démarré pour voir les requêtes SQL et les logs.

---

## 🎨 Collection Postman

Importez le fichier JSON généré séparément pour avoir tous les tests prêts !

**Variables d'environnement suggérées :**
- `base_url` : `http://localhost:8082`
- `eventId` : `1`
- `userId` : `1`
- `reservationId` : `{{last_reservation_id}}` (à définir dynamiquement)

---

## 🔥 Bon à savoir

1. **Expiration automatique** : Les réservations PENDING expirent après 15 minutes
2. **Verrouillage optimiste** : Le champ `version` dans `inventory` évite les conflits
3. **Idempotence** : Utilisez `Idempotency-Key` pour éviter les doublons
4. **Swagger UI** : Testez directement depuis http://localhost:8082/swagger-ui.html

---

Bon testing ! 🚀
