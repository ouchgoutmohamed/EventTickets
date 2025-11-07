# ✅ Checklist Déploiement Production

## 🚨 CRITIQUE (Bloquant Déploiement)

### Sécurité
- [ ] **JWT/OAuth2 Configuré**
  ```java
  // SecurityConfig.java
  .anyRequest().authenticated()  // ← Décommenter
  ```
- [ ] **Variables d'environnement externalisées**
  ```yaml
  spring:
    datasource:
      password: ${DB_PASSWORD}  # Pas de mot de passe en clair
  ```
- [ ] **HTTPS activé** (certificat SSL/TLS)
- [ ] **CORS configuré** (si frontend séparé)

### Base de Données
- [ ] **Migration Flyway/Liquibase**
  ```yaml
  spring:
    jpa:
      hibernate:
        ddl-auto: validate  # ← Jamais 'update' en prod
    flyway:
      enabled: true
  ```
- [ ] **Backup automatisé** configuré
- [ ] **Indexes vérifiés** (voir DIAGRAMS.md)
- [ ] **Pool de connexions optimisé**
  ```yaml
  hikari:
    maximum-pool-size: ${DB_POOL_SIZE:20}
  ```

### Tests
- [ ] **Tests unitaires** (coverage > 70%)
  ```bash
  mvn test
  ```
- [ ] **Tests d'intégration** (@SpringBootTest)
- [ ] **Tests de charge** (JMeter/Gatling)
  - Concurrence réservations simultanées
  - Performance sous charge
- [ ] **Tests sécurité** (OWASP Top 10)

### Monitoring
- [ ] **Actuator activé**
  ```yaml
  management:
    endpoints:
      web:
        exposure:
          include: health,metrics,prometheus
  ```
- [ ] **Logs centralisés** (ELK, CloudWatch)
- [ ] **Métriques** (Prometheus + Grafana)
- [ ] **Alertes configurées**
  - Erreurs 500
  - Latence > 1s
  - Disponibilité < 99%

---

## ⚠️ IMPORTANT (Pré-Déploiement)

### Configuration
- [ ] **Profils Spring** (dev, staging, prod)
  ```bash
  --spring.profiles.active=prod
  ```
- [ ] **Timeouts optimisés**
  ```yaml
  spring:
    transaction:
      default-timeout: 30
  server:
    tomcat:
      connection-timeout: 20000
  ```
- [ ] **Rate limiting activé**
  ```yaml
  ticket-inventory:
    rate-limiting:
      enabled: true
      requests-per-minute: 100
  ```

### Résilience
- [ ] **Circuit breaker** (Resilience4j)
  ```xml
  <dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot2</artifactId>
  </dependency>
  ```
- [ ] **Retry mechanism** (appels externes)
- [ ] **Timeout sur requêtes DB**
- [ ] **Health checks** détaillés
  ```java
  @Component
  public class DatabaseHealthIndicator implements HealthIndicator {
      // Vérifier connexion DB
  }
  ```

### Performance
- [ ] **Cache Redis** (disponibilités)
  ```java
  @Cacheable("availability")
  public AvailabilityResponse getAvailability(Long eventId)
  ```
- [ ] **Connection pooling optimisé** (HikariCP)
- [ ] **Query optimization** (EXPLAIN ANALYZE)
- [ ] **Lazy loading désactivé** (`open-in-view: false`)

---

## 📋 RECOMMANDÉ

### Observabilité
- [ ] **Distributed tracing** (Sleuth + Zipkin/Jaeger)
- [ ] **Request ID propagation**
  ```java
  MDC.put("requestId", UUID.randomUUID().toString());
  ```
- [ ] **Logs JSON structurés**
  ```xml
  <dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
  </dependency>
  ```

### Scalabilité
- [ ] **Containerisation** (Docker)
  ```dockerfile
  FROM eclipse-temurin:17-jre-alpine
  COPY target/*.jar app.jar
  ENTRYPOINT ["java", "-jar", "/app.jar"]
  ```
- [ ] **Orchestration** (Kubernetes/Docker Swarm)
- [ ] **Horizontal scaling** (plusieurs instances)
- [ ] **Load balancer** configuré

### Messaging (Si Architecture Événementielle)
- [ ] **Kafka/RabbitMQ** configuré
- [ ] **Événements publiés**
  - `ReservationCreated`
  - `ReservationConfirmed`
  - `ReservationExpired`
- [ ] **Dead Letter Queue** (échecs)

### Documentation
- [ ] **OpenAPI publié** (Swagger UI désactivé en prod)
- [ ] **Runbook opérationnel**
  - Procédures de déploiement
  - Troubleshooting commun
  - Rollback steps
- [ ] **Diagrammes à jour** (architecture, flux)

---

## 🧪 VALIDATION PRÉ-PRODUCTION

### Tests Fonctionnels
```bash
# 1. Réservation standard
curl -X POST http://api.example.com/tickets/reserve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"eventId":1,"userId":42,"quantity":2}'
# Attendu: 200 OK, reservationId retourné

# 2. Stock insuffisant
curl -X POST http://api.example.com/tickets/reserve \
  -d '{"eventId":1,"userId":42,"quantity":999}'
# Attendu: 409 Conflict

# 3. Idempotence
IDEM_KEY=$(uuidgen)
curl -X POST ... -H "Idempotency-Key: $IDEM_KEY" ...
curl -X POST ... -H "Idempotency-Key: $IDEM_KEY" ...
# Attendu: Même reservationId pour les 2 requêtes

# 4. Expiration automatique
# Attendre 20 minutes après réservation
curl http://api.example.com/tickets/user/42
# Attendu: Status = EXPIRED
```

### Tests Non-Fonctionnels
```bash
# Latence (doit être < 500ms p95)
ab -n 1000 -c 10 http://api.example.com/tickets/availability/1

# Concurrence (overbooking)
# 10 utilisateurs réservent 5 tickets sur stock de 10
# Attendu: 2 succès, 8 refus (stock insuffisant)

# Memory leak
# Monitorer heap après 1000 requêtes
jmap -heap <PID>
```

---

## 🚀 DÉPLOIEMENT

### Checklist Pré-Déploiement
- [ ] **Backup DB** effectué
- [ ] **Plan de rollback** documenté
- [ ] **Fenêtre de maintenance** communiquée
- [ ] **Équipe d'astreinte** alertée

### Procédure Déploiement
```bash
# 1. Build
mvn clean package -DskipTests=false

# 2. Tests pré-déploiement
mvn verify

# 3. Backup DB
mysqldump ticket_inventory > backup_$(date +%Y%m%d).sql

# 4. Deploy (exemple Docker)
docker build -t ticket-inventory:v1.0.0 .
docker tag ticket-inventory:v1.0.0 registry.example.com/ticket-inventory:v1.0.0
docker push registry.example.com/ticket-inventory:v1.0.0

# 5. Update deployment (Kubernetes)
kubectl set image deployment/ticket-inventory \
  ticket-inventory=registry.example.com/ticket-inventory:v1.0.0

# 6. Vérifier rollout
kubectl rollout status deployment/ticket-inventory

# 7. Smoke tests
curl http://api.example.com/actuator/health
curl http://api.example.com/tickets/availability/1
```

### Vérifications Post-Déploiement
- [ ] **Health check** OK
- [ ] **Logs** sans erreurs
- [ ] **Métriques** normales (CPU, RAM, latence)
- [ ] **Smoke tests** passent
- [ ] **Monitoring** actif

---

## 🔥 ROLLBACK (Si Problème)

### Triggers de Rollback
- Erreur rate > 5%
- Latence p95 > 2s
- Disponibilité < 95%
- Erreurs DB critiques

### Procédure Rollback
```bash
# 1. Rollback Kubernetes
kubectl rollout undo deployment/ticket-inventory

# 2. Vérifier version
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}'

# 3. Restore DB (si migration)
mysql ticket_inventory < backup_20251107.sql

# 4. Vérifier
curl http://api.example.com/actuator/health
```

---

## 📊 MÉTRIQUES CLÉS (Monitoring)

### SLIs (Service Level Indicators)
```
Disponibilité: > 99.5%
Latence p50:   < 100ms
Latence p95:   < 500ms
Latence p99:   < 1000ms
Error rate:    < 0.1%
```

### Métriques Métier
```
- Réservations/heure
- Taux de confirmation (confirmées/réservées)
- Taux d'expiration (expirées/réservées)
- Stock moyen disponible par événement
- Temps moyen de confirmation
```

### Alertes Critiques
```
- DB Connection Pool exhausted
- Memory > 90%
- Error rate > 1% (5 min)
- Latence p95 > 2s (5 min)
- Health check failed (3 fois)
```

---

## 📞 CONTACTS URGENCE

```
Équipe Dev:     dev-team@example.com
Ops On-Call:    +33 X XX XX XX XX
DBA:            dba@example.com
Security:       security@example.com
PagerDuty:      https://example.pagerduty.com
```

---

## ✅ VALIDATION FINALE

**Chef de Projet**: _____________ Date: _______

**Tech Lead**:      _____________ Date: _______

**DevOps**:         _____________ Date: _______

**QA**:             _____________ Date: _______

**Sécurité**:       _____________ Date: _______

---

**🎯 Prêt pour Production**: [ ] OUI  [ ] NON

**Raison si NON**: _______________________________
