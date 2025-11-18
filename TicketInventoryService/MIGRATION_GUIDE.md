# 🚀 Guide de Migration Rapide

## Changements Impactants

### 1. Configuration Database

**⚠️ Action Requise**: Renommer/supprimer `application.properties`

L'ancien fichier `application.properties` a été migré vers `application.yml`. Si les deux existent, Spring Boot chargera les deux (properties prioritaire).

```bash
# Supprimer l'ancien fichier
rm src/main/resources/application.properties
```

### 2. Nouvelle Couche Service

**Avant** (code utilisateur):
```java
// N'existe pas - logique dans contrôleur
```

**Après** (si besoin d'appeler le service):
```java
@Autowired
private TicketInventoryService ticketInventoryService;

// Utiliser les méthodes publiques
ticketInventoryService.reserveTickets(request, idempotencyKey);
ticketInventoryService.confirmReservation(request);
```

### 3. Gestion des Erreurs

**Nouvelles exceptions à catch** (si besoin):
```java
try {
    service.reserveTickets(...);
} catch (InsufficientStockException e) {
    // Stock insuffisant - afficher message utilisateur
} catch (ReservationNotFoundException e) {
    // Réservation introuvable
}
```

Toutes les exceptions sont gérées automatiquement par `GlobalExceptionHandler` et retournent du JSON standardisé.

### 4. Header Idempotency-Key

**Nouveau**: Support du header pour éviter les doublons

```http
POST /tickets/reserve
Content-Type: application/json
Idempotency-Key: unique-uuid-123

{
  "eventId": 1,
  "userId": 42,
  "quantity": 2
}
```

Si la même clé est envoyée 2×, la 2ème requête retourne la réservation existante.

### 5. Nettoyage Automatique

**Nouveau**: Les réservations expirées sont automatiquement nettoyées toutes les 5 minutes.

Configurable dans `application.yml`:
```yaml
ticket-inventory:
  reservation:
    cleanup-cron: "0 */5 * * * *"
```

### 6. Sécurité Désactivée

**⚠️ Temporaire**: Spring Security est configuré en mode permissif pour le développement.

**En production**, activer l'authentification:
```java
// SecurityConfig.java
.anyRequest().authenticated()  // ← Décommenter
```

## Vérification Post-Migration

### 1. Démarrer l'application

```bash
./mvnw clean spring-boot:run
```

### 2. Vérifier Swagger UI

Ouvrir: http://localhost:8082/swagger-ui.html

### 3. Tester un endpoint

```bash
# Disponibilité
curl http://localhost:8082/tickets/availability/1

# Réservation
curl -X POST http://localhost:8082/tickets/reserve \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-123" \
  -d '{
    "eventId": 1,
    "userId": 42,
    "quantity": 2
  }'
```

### 4. Vérifier les logs

Chercher dans les logs:
```
Début du nettoyage des réservations expirées
```

Si visible → Scheduled tasks fonctionnent ✅

## Problèmes Courants

### Erreur: `Table 'inventory' doesn't exist`

**Solution**: Créer manuellement ou laisser Hibernate générer:
```sql
-- Ou attendre le 1er démarrage avec ddl-auto=update
```

### Erreur: `Could not autowire TicketInventoryService`

**Solution**: Vérifier que le package scan inclut `com.acme.tickets`:
```java
@SpringBootApplication  // Scanne com.acme.tickets.*
public class TicketInventoryApplication { }
```

### Erreur: `403 Forbidden` sur tous les endpoints

**Solution**: Vérifier que `SecurityConfig` est chargé:
```bash
# Logs au démarrage
2025-11-07 ... SecurityConfig : Initializing Spring Security
```

## TODOs Immédiats

- [ ] Créer les tables DB initiales
- [ ] Peupler `inventory` avec des événements de test
- [ ] Tester les 5 endpoints via Swagger
- [ ] Vérifier les logs (pas d'erreurs)
- [ ] Tester l'idempotence (2× même Idempotency-Key)

## Support

Voir fichiers:
- `REFACTORING_AUDIT.md` - Audit complet
- `ARCHITECTURE.md` - Architecture technique
- Swagger UI - Documentation interactive
