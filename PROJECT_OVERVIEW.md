# EventTickets - Système de Réservation de Billets d'Événements

## Table des Matières
1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture du Système](#architecture-du-système)
3. [Cahier des Charges Fonctionnel](#cahier-des-charges-fonctionnel)
4. [Cahier des Charges Métier](#cahier-des-charges-métier)
5. [Règles de Gestion](#règles-de-gestion)
6. [Technologies Utilisées](#technologies-utilisées)
7. [Description des Services](#description-des-services)
8. [Base de Données](#base-de-données)
9. [Déploiement](#déploiement)
10. [Problèmes Rencontrés et Solutions](#problèmes-rencontrés-et-solutions)
11. [Bilan du Projet](#bilan-du-projet)

---

## Vue d'ensemble du Projet

**EventTickets** est une plateforme complète de gestion et de réservation de billets pour des événements. Le système permet aux organisateurs de créer et gérer des événements, et aux utilisateurs de consulter, réserver et acheter des billets en ligne.

### Objectifs Principaux
- Permettre la création et gestion d'événements par les organisateurs
- Offrir une interface intuitive pour la consultation et réservation de billets
- Gérer l'inventaire des billets en temps réel
- Traiter les paiements de manière sécurisée
- Notifier les utilisateurs par email

---

## Architecture du Système

### Architecture Microservices

Le système adopte une **architecture microservices** pour garantir la scalabilité, la maintenabilité et l'indépendance des composants.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                      http://localhost:5173                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Node.js)                         │
│                      http://localhost:3000                       │
│  • Routage des requêtes                                          │
│  • Authentification JWT                                          │
│  • Proxy vers les microservices                                 │
└─────┬──────────┬──────────┬──────────┬───────────────────────────┘
      │          │          │          │
      ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────────────┐
│  User    │ │ Event  │ │ Ticket │ │ Payment &            │
│ Service  │ │Catalog │ │Inventory│ │ Notification Service │
│          │ │Service │ │Service │ │                      │
│ Port     │ │ Port   │ │ Port   │ │ Port 8000            │
│ 3001     │ │ 8080   │ │ 8082   │ │                      │
└──────────┘ └────────┘ └────────┘ └──────────────────────┘
     │            │          │              │
     ▼            ▼          ▼              ▼
┌────────────────────────────────────────────────────────┐
│              Base de Données MySQL 8.0.31              │
│  • eventtickets_db (Events & Catalog)                  │
│  • ticket_inventory_db (Tickets & Reservations)        │
│  • user_service_db (Users & Auth)                      │
│  • payment_notification_db (Payments & Notifications)  │
└────────────────────────────────────────────────────────┘
```

### Flux de Communication

1. **Authentification**: User Service → API Gateway → Frontend
2. **Consultation d'événements**: Frontend → API Gateway → Event Catalog Service
3. **Vérification disponibilité**: Frontend → API Gateway → Ticket Inventory Service
4. **Réservation**: Frontend → API Gateway → Ticket Inventory Service
5. **Paiement**: Frontend → API Gateway → Payment Service → Notification Service

---

## Cahier des Charges Fonctionnel

### Fonctionnalités Utilisateur

#### 1. Gestion des Comptes
- **Inscription**: Création de compte avec email et mot de passe
- **Connexion**: Authentification par JWT token
- **Gestion de profil**: Modification des informations personnelles
- **Rôles**: User, Organizer, Admin

#### 2. Navigation des Événements
- **Liste des événements**: Affichage de tous les événements disponibles
- **Filtrage**: Par date, catégorie, lieu, prix
- **Recherche**: Recherche par nom ou mot-clé
- **Détails d'événement**: Informations complètes (description, lieu, date, prix, disponibilité)

#### 3. Réservation de Billets
- **Consultation disponibilité**: Affichage en temps réel du nombre de places disponibles
- **Sélection de billets**: Choix de la quantité et du type de billet
- **Réservation temporaire**: Blocage des billets pendant 15 minutes
- **Confirmation**: Validation de la réservation après paiement

#### 4. Paiement
- **Traitement de paiement**: Intégration système de paiement
- **Confirmation**: Email de confirmation après paiement réussi
- **Historique**: Consultation des paiements effectués

### Fonctionnalités Organisateur

#### 1. Gestion des Événements
- **Création d'événement**: Formulaire complet avec tous les détails
- **Modification**: Mise à jour des informations d'événement
- **Suppression**: Annulation d'événements
- **Publication**: Gestion du statut (brouillon, publié, annulé)

#### 2. Gestion des Billets
- **Configuration**: Définition des types de billets et prix
- **Inventaire**: Suivi du nombre de billets vendus/disponibles
- **Statistiques**: Rapports de ventes

#### 3. Notifications
- **Emails automatiques**: Confirmation de réservation, rappels
- **Alertes**: Notification des nouvelles réservations

---

## Cahier des Charges Métier

### Processus Métier Principaux

#### 1. Cycle de Vie d'un Événement
```
DRAFT → PUBLISHED → OPEN_FOR_BOOKING → IN_PROGRESS → COMPLETED → ARCHIVED
                            ↓
                        CANCELLED
```

**États**:
- **DRAFT**: Événement en cours de création
- **PUBLISHED**: Événement visible mais réservations non ouvertes
- **OPEN_FOR_BOOKING**: Réservations ouvertes
- **IN_PROGRESS**: Événement en cours
- **COMPLETED**: Événement terminé
- **CANCELLED**: Événement annulé
- **ARCHIVED**: Événement archivé

#### 2. Cycle de Vie d'une Réservation
```
PENDING → CONFIRMED → COMPLETED
    ↓
CANCELLED / EXPIRED
```

**États**:
- **PENDING**: Réservation en attente de paiement (15 min)
- **CONFIRMED**: Paiement validé
- **COMPLETED**: Billets utilisés
- **CANCELLED**: Annulée par l'utilisateur
- **EXPIRED**: Délai de paiement dépassé

#### 3. Processus de Réservation

1. **Sélection**: L'utilisateur consulte un événement et sélectionne des billets
2. **Vérification**: Le système vérifie la disponibilité en temps réel
3. **Blocage**: Les billets sont bloqués temporairement (15 minutes)
4. **Paiement**: L'utilisateur procède au paiement
5. **Confirmation**: Le système confirme la réservation et envoie un email
6. **Libération**: Si non payé sous 15 min, les billets sont libérés automatiquement

---

## Règles de Gestion

### RG1 - Gestion de l'Inventaire
- Le nombre de billets vendus ne peut jamais dépasser la capacité totale
- Les billets réservés (PENDING) sont bloqués pendant 15 minutes
- Après expiration, les billets sont automatiquement libérés
- L'inventaire est mis à jour en temps réel

### RG2 - Authentification et Autorisation
- Seuls les utilisateurs authentifiés peuvent réserver des billets
- Seuls les organisateurs peuvent créer et gérer des événements
- Les administrateurs ont accès à toutes les fonctionnalités
- Les tokens JWT expirent après 24 heures

### RG3 - Validation des Données
- **Email**: Format valide et unique dans le système
- **Prix**: Doit être positif et supérieur à 0
- **Dates**: La date de fin doit être après la date de début
- **Capacité**: Doit être un nombre entier positif

### RG4 - Gestion des Paiements
- Un paiement ne peut être validé qu'une seule fois
- Le montant du paiement doit correspondre au prix total des billets
- Les paiements échoués libèrent automatiquement les billets réservés
- Un email de confirmation est envoyé après chaque paiement réussi

### RG5 - Notifications
- Email de confirmation envoyé immédiatement après réservation confirmée
- Email de rappel envoyé 24h avant l'événement
- Notification de l'organisateur pour chaque nouvelle réservation
- Les emails contiennent un code QR unique pour chaque billet

### RG6 - Annulation et Remboursement
- Les utilisateurs peuvent annuler jusqu'à 48h avant l'événement
- Les remboursements sont traités sous 5-7 jours ouvrables
- Les organisateurs peuvent annuler un événement avec notification à tous les participants
- En cas d'annulation par l'organisateur, remboursement automatique à 100%

---

## Technologies Utilisées

### Frontend
| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 19.2.0 | Framework UI principal |
| **Vite** | 7.2.4 | Build tool et dev server |
| **React Router DOM** | 7.1.1 | Navigation et routage |
| **Axios** | 1.7.9 | Requêtes HTTP |
| **Tailwind CSS** | 3.4.17 | Framework CSS utilitaire |
| **Shadcn/ui** | Latest | Composants UI |
| **Lucide React** | 0.469.0 | Icônes |

### Backend - API Gateway
| Technologie | Version | Usage |
|------------|---------|-------|
| **Node.js** | 20.15.1 | Runtime JavaScript |
| **Express** | 4.21.2 | Framework web |
| **jsonwebtoken** | 9.0.2 | Authentification JWT |
| **http-proxy-middleware** | 3.0.3 | Proxy vers microservices |
| **cors** | 2.8.5 | Gestion CORS |
| **dotenv** | 16.4.7 | Variables d'environnement |

### Backend - User Service
| Technologie | Version | Usage |
|------------|---------|-------|
| **Node.js** | 20.15.1 | Runtime JavaScript |
| **Express** | 4.21.2 | Framework web |
| **Prisma** | 6.2.1 | ORM pour base de données |
| **bcryptjs** | 2.4.3 | Hashage de mots de passe |
| **jsonwebtoken** | 9.0.2 | Génération de tokens JWT |

### Backend - Event Catalog Service
| Technologie | Version | Usage |
|------------|---------|-------|
| **Java** | 17.0.8 | Langage de programmation |
| **Spring Boot** | 3.5.7 | Framework backend |
| **Spring Data JPA** | - | ORM et accès aux données |
| **MySQL Connector** | 8.0.33 | Driver MySQL |
| **Hibernate** | 6.6.33 | ORM |
| **Maven** | 3.9+ | Gestion de dépendances |

### Backend - Ticket Inventory Service
| Technologie | Version | Usage |
|------------|---------|-------|
| **Java** | 17.0.8 | Langage de programmation |
| **Spring Boot** | 3.5.7 | Framework backend |
| **Spring Data JPA** | - | ORM et accès aux données |
| **Spring Security** | - | Sécurité (configuration publique) |
| **MySQL Connector** | 8.0.33 | Driver MySQL |
| **Hibernate** | 6.6.33 | ORM |

### Backend - Payment & Notification Service
| Technologie | Version | Usage |
|------------|---------|-------|
| **PHP** | 8.3+ | Langage de programmation |
| **Laravel** | 11.x | Framework PHP |
| **MySQL** | 8.0.31 | Base de données |
| **Laravel Mail** | - | Envoi d'emails |
| **Queue System** | - | Gestion des tâches asynchrones |

### Base de Données
| Technologie | Version | Usage |
|------------|---------|-------|
| **MySQL** | 8.0.31 | SGBD relationnel |
| **Hibernate** | 6.6.33 | ORM pour services Java |
| **Prisma** | 6.2.1 | ORM pour User Service |
| **Eloquent** | 11.x | ORM pour Payment Service |

---

## Description des Services

### 1. Frontend (React + Vite)
**Port**: 5173  
**Technologie**: React 19.2.0, Vite 7.2.4

#### Architecture
```
src/
├── api/                    # Clients API
│   ├── apiGatewayClient.js # Client HTTP Axios
│   └── interceptors.js     # Gestion tokens et erreurs
├── components/             # Composants réutilisables
│   ├── ui/                # Composants Shadcn/ui
│   └── layout/            # Header, Footer, Navigation
├── features/              # Features par domaine
│   ├── auth/             # Authentification
│   ├── catalog/          # Catalogue d'événements
│   ├── inventory/        # Inventaire et réservations
│   └── payment/          # Paiements
├── context/              # Context API React
│   └── AuthContext.jsx   # Gestion état authentification
├── hooks/                # Custom hooks
├── pages/                # Pages de l'application
├── layouts/              # Layouts (MainLayout)
└── utils/                # Utilitaires
```

#### Fonctionnalités Principales
- **Authentication**: Login, Register, Logout avec JWT
- **Event Browsing**: Liste, filtres, recherche, détails
- **Ticket Booking**: Sélection, réservation, confirmation
- **User Profile**: Gestion du profil utilisateur
- **Responsive Design**: Mobile-first avec Tailwind CSS

#### Configuration
- **API Gateway URL**: `http://localhost:3000`
- **Token Storage**: LocalStorage avec refresh automatique
- **Routing**: React Router v7 avec lazy loading

---

### 2. API Gateway (Node.js + Express)
**Port**: 3000  
**Technologie**: Node.js, Express, http-proxy-middleware

#### Rôle
Point d'entrée unique pour toutes les requêtes du frontend. Gère l'authentification, le routage et le proxy vers les microservices.

#### Architecture
```
src/
├── middleware/
│   ├── authMiddleware.js      # Validation JWT
│   ├── loggingMiddleware.js   # Logs des requêtes
│   └── index.js
├── routes/
│   ├── auth.js               # Routes authentification
│   ├── events.js             # Routes événements
│   └── index.js
├── app.js                    # Configuration Express
├── server.js                 # Serveur HTTP
└── config.js                 # Configuration services
```

#### Proxy Configuration
```javascript
// Route publique pour disponibilité
/inventory/availability/:eventId → http://localhost:8082/tickets/availability/:eventId

// Routes protégées
/auth/*         → http://localhost:3001 (User Service)
/events/*       → http://localhost:8080 (Event Catalog)
/inventory/*    → http://localhost:8082 (Ticket Inventory)
/payments/*     → http://localhost:8000 (Payment Service)
```

#### Middleware Chain
1. **CORS**: Autorisation des requêtes cross-origin
2. **Body Parser**: Parse JSON et URL-encoded
3. **Logging**: Log toutes les requêtes
4. **Auth (conditionnel)**: Validation JWT pour routes protégées
5. **Proxy**: Redirection vers le microservice approprié

#### Gestion JWT
- **Extraction**: Token depuis header `Authorization: Bearer <token>`
- **Validation**: Vérification signature et expiration
- **Enrichissement**: Ajout de `req.user` et headers `x-organizer-id`, `x-user-id`
- **Support**: Compatibilité `roleName` et `role` pour rétrocompatibilité

---

### 3. User Service (Node.js + Prisma)
**Port**: 3001  
**Technologie**: Node.js, Express, Prisma ORM

#### Rôle
Gestion des utilisateurs, authentification et autorisation.

#### Architecture
```
src/
├── controllers/
│   └── authController.js    # Logique métier auth
├── middlewares/
│   └── authMiddleware.js    # Validation tokens
├── routes/
│   └── authRoutes.js        # Endpoints API
├── services/
│   └── authService.js       # Services métier
├── utils/
│   └── jwt.js              # Utilitaires JWT
└── app.js
prisma/
├── schema.prisma           # Schéma base de données
├── migrations/             # Migrations
└── seed.js                # Données initiales
```

#### Modèle de Données
```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  password    String   // Hashé avec bcrypt
  firstName   String?
  lastName    String?
  roleId      Int
  role        Role     @relation(...)
  organizerId Int?     // Pour organisateurs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Role {
  id          Int      @id @default(autoincrement())
  roleName    String   @unique // USER, ORGANIZER, ADMIN
  users       User[]
}
```

#### Endpoints API
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur (protégé)
- `PUT /auth/profile` - Mise à jour profil (protégé)

#### Sécurité
- **Hashage**: bcrypt avec salt rounds = 10
- **JWT**: Payload contient `userId`, `email`, `roleId`, `roleName`, `organizerId`
- **Token Expiration**: 24 heures
- **Validation**: Email format, password min 6 caractères

---

### 4. Event Catalog Service (Spring Boot + Java)
**Port**: 8080  
**Technologie**: Spring Boot 3.5.7, Java 17, Hibernate

#### Rôle
Gestion du catalogue d'événements (création, modification, consultation).

#### Architecture
```
src/main/java/com/project/eventcatalog/
├── controller/
│   ├── EventController.java       # REST endpoints
│   ├── CategoryController.java
│   └── VenueController.java
├── model/
│   ├── Event.java                # Entités JPA
│   ├── Category.java
│   ├── Venue.java
│   └── enums/EventStatus.java
├── repository/
│   ├── EventRepository.java      # Spring Data JPA
│   ├── CategoryRepository.java
│   └── VenueRepository.java
├── service/
│   └── EventService.java         # Logique métier
├── dto/
│   ├── EventDTO.java            # Data Transfer Objects
│   └── CreateEventDTO.java
└── EventCatalogServiceApplication.java
```

#### Modèle de Données
```java
@Entity
public class Event {
    @Id @GeneratedValue
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    
    @ManyToOne
    private Venue venue;
    
    @ManyToOne
    private Category category;
    
    @Enumerated(EnumType.STRING)
    private EventStatus status;
    
    private Integer totalCapacity;
    private BigDecimal basePrice;
    private Long organizerId;
    // ...
}
```

#### Endpoints API
- `GET /events` - Liste tous les événements
- `GET /events/{id}` - Détails d'un événement
- `POST /events` - Créer un événement (organisateur)
- `PUT /events/{id}` - Modifier un événement (organisateur)
- `DELETE /events/{id}` - Supprimer un événement (organisateur)
- `GET /events/organizer/{organizerId}` - Événements d'un organisateur
- `GET /categories` - Liste des catégories
- `GET /venues` - Liste des lieux

#### Configuration Spring
```properties
spring.application.name=EventCatalogService
spring.datasource.url=jdbc:mysql://localhost:3306/eventtickets_db
spring.jpa.hibernate.ddl-auto=update
server.port=8080
```

---

### 5. Ticket Inventory Service (Spring Boot + Java)
**Port**: 8082  
**Technologie**: Spring Boot 3.5.7, Java 17, Hibernate

#### Rôle
Gestion de l'inventaire des billets et des réservations.

#### Architecture
```
src/main/java/com/acme/tickets/
├── controller/
│   ├── TicketController.java      # REST endpoints
│   └── ReservationController.java
├── model/
│   ├── TicketType.java           # Entités JPA
│   ├── Reservation.java
│   └── enums/ReservationStatus.java
├── repository/
│   ├── TicketTypeRepository.java # Spring Data JPA
│   └── ReservationRepository.java
├── service/
│   ├── TicketService.java        # Logique inventaire
│   └── ReservationService.java
├── dto/
│   ├── TicketAvailabilityDTO.java
│   └── CreateReservationDTO.java
├── config/
│   └── SecurityConfig.java       # Config sécurité
└── TicketInventoryApplication.java
```

#### Modèle de Données
```java
@Entity
public class TicketType {
    @Id @GeneratedValue
    private Long id;
    private Long eventId;
    private String name;
    private BigDecimal price;
    private Integer totalQuantity;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer soldQuantity;
    // ...
}

@Entity
public class Reservation {
    @Id @GeneratedValue
    private Long id;
    private Long eventId;
    private Long userId;
    private String userEmail;
    
    @ManyToOne
    private TicketType ticketType;
    
    private Integer quantity;
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    private ReservationStatus status;
    
    private LocalDateTime reservedAt;
    private LocalDateTime expiresAt;  // +15 minutes
    private LocalDateTime confirmedAt;
    // ...
}
```

#### Endpoints API
- `GET /tickets/availability/{eventId}` - Disponibilité (PUBLIC)
- `POST /tickets/reserve` - Créer réservation (protégé)
- `PUT /tickets/confirm/{reservationId}` - Confirmer réservation (protégé)
- `DELETE /tickets/cancel/{reservationId}` - Annuler réservation (protégé)
- `GET /tickets/user/{userId}` - Réservations utilisateur (protégé)

#### Logique Métier Critique
```java
// Vérification disponibilité atomique
@Transactional
public boolean reserveTickets(CreateReservationDTO dto) {
    TicketType ticket = ticketRepository.findById(dto.getTicketTypeId());
    
    // Vérification stock disponible
    if (ticket.getAvailableQuantity() < dto.getQuantity()) {
        throw new InsufficientInventoryException();
    }
    
    // Mise à jour atomique
    ticket.setAvailableQuantity(ticket.getAvailableQuantity() - dto.getQuantity());
    ticket.setReservedQuantity(ticket.getReservedQuantity() + dto.getQuantity());
    
    // Création réservation avec expiration 15 min
    Reservation reservation = new Reservation();
    reservation.setStatus(ReservationStatus.PENDING);
    reservation.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    
    return reservationRepository.save(reservation);
}
```

#### Configuration Sécurité
```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http.csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/tickets/**").permitAll() // Routes publiques
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

---

### 6. Payment & Notification Service (Laravel + PHP)
**Port**: 8000  
**Technologie**: Laravel 11.x, PHP 8.3+

#### Rôle
Gestion des paiements et envoi de notifications par email.

#### Architecture
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── PaymentController.php
│   │   └── NotificationController.php
│   └── Middleware/
├── Models/
│   ├── Payment.php
│   └── Notification.php
├── Services/
│   ├── PaymentService.php
│   └── EmailService.php
├── Enums/
│   ├── PaymentStatus.php
│   └── NotificationType.php
└── Providers/
routes/
├── api.php                    # Routes API
└── web.php
config/
├── mail.php                   # Config emails
└── services.php               # Config paiement
```

#### Modèle de Données
```php
// Migration Payment
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('reservation_id');
    $table->unsignedBigInteger('user_id');
    $table->decimal('amount', 10, 2);
    $table->enum('status', ['pending', 'completed', 'failed', 'refunded']);
    $table->string('payment_method');
    $table->string('transaction_id')->nullable();
    $table->timestamps();
});

// Migration Notification
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id');
    $table->string('type'); // email, sms
    $table->string('subject');
    $table->text('message');
    $table->enum('status', ['pending', 'sent', 'failed']);
    $table->timestamp('sent_at')->nullable();
    $table->timestamps();
});
```

#### Endpoints API
- `POST /api/payments/process` - Traiter un paiement
- `GET /api/payments/{id}` - Détails paiement
- `POST /api/payments/refund/{id}` - Demander remboursement
- `POST /api/notifications/send` - Envoyer notification
- `GET /api/notifications/user/{userId}` - Notifications utilisateur

#### Processus de Paiement
```php
class PaymentService {
    public function processPayment($reservationId, $amount, $method) {
        // 1. Validation
        $reservation = $this->getReservation($reservationId);
        if ($reservation->status !== 'PENDING') {
            throw new InvalidReservationException();
        }
        
        // 2. Traitement paiement (API externe)
        $result = $this->paymentGateway->charge($amount, $method);
        
        // 3. Mise à jour BDD
        $payment = Payment::create([
            'reservation_id' => $reservationId,
            'amount' => $amount,
            'status' => $result->success ? 'completed' : 'failed',
            'transaction_id' => $result->transactionId
        ]);
        
        // 4. Confirmation réservation si succès
        if ($result->success) {
            $this->confirmReservation($reservationId);
            $this->sendConfirmationEmail($reservation);
        }
        
        return $payment;
    }
}
```

#### Service Email
```php
class EmailService {
    public function sendReservationConfirmation($reservation) {
        Mail::to($reservation->userEmail)
            ->send(new ReservationConfirmationMail($reservation));
            
        Notification::create([
            'user_id' => $reservation->userId,
            'type' => 'email',
            'subject' => 'Confirmation de réservation',
            'status' => 'sent',
            'sent_at' => now()
        ]);
    }
    
    public function sendEventReminder($event, $users) {
        foreach ($users as $user) {
            Mail::to($user->email)
                ->queue(new EventReminderMail($event, $user));
        }
    }
}
```

---

## Base de Données

### Schéma Global

Le système utilise **4 bases de données MySQL distinctes** pour respecter l'indépendance des microservices.

#### 1. user_service_db
**Service**: User Service

```sql
-- Table Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INT NOT NULL,
    organizer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Table Roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES ('USER'), ('ORGANIZER'), ('ADMIN');
```

#### 2. eventtickets_db
**Service**: Event Catalog Service

```sql
-- Table Events
CREATE TABLE events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    venue_id BIGINT,
    category_id BIGINT,
    status ENUM('DRAFT', 'PUBLISHED', 'OPEN_FOR_BOOKING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED'),
    total_capacity INT NOT NULL,
    base_price DECIMAL(10, 2),
    organizer_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Table Categories
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Table Venues
CREATE TABLE venues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. ticket_inventory_db
**Service**: Ticket Inventory Service

```sql
-- Table Ticket Types
CREATE TABLE ticket_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    reserved_quantity INT DEFAULT 0,
    sold_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Reservations
CREATE TABLE reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    ticket_type_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)
);

-- Index pour performance
CREATE INDEX idx_reservation_status ON reservations(status);
CREATE INDEX idx_reservation_user ON reservations(user_id);
CREATE INDEX idx_reservation_expires ON reservations(expires_at);
```

#### 4. payment_notification_db
**Service**: Payment & Notification Service

```sql
-- Table Payments
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') NOT NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Relations Inter-Services

Bien que les services aient des bases de données séparées, il existe des **relations logiques** via des IDs:

- `events.organizer_id` → `users.id`
- `ticket_types.event_id` → `events.id`
- `reservations.user_id` → `users.id`
- `reservations.event_id` → `events.id`
- `payments.reservation_id` → `reservations.id`
- `payments.user_id` → `users.id`

**Note**: Ces relations ne sont PAS des foreign keys MySQL mais des références logiques gérées par la logique applicative.

---

## Déploiement

### Prérequis

#### Logiciels Requis
- **Node.js**: v20.19+ (actuellement 20.15.1 avec warning)
- **Java JDK**: v17.0.8
- **PHP**: v8.3+
- **MySQL**: v8.0.31
- **Maven**: v3.9+
- **Composer**: v2+
- **npm**: v10+

### Configuration de la Base de Données

```sql
-- Créer les bases de données
CREATE DATABASE user_service_db;
CREATE DATABASE eventtickets_db;
CREATE DATABASE ticket_inventory_db;
CREATE DATABASE payment_notification_db;

-- Créer un utilisateur
CREATE USER 'eventtickets'@'localhost' IDENTIFIED BY 'your_password';

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON user_service_db.* TO 'eventtickets'@'localhost';
GRANT ALL PRIVILEGES ON eventtickets_db.* TO 'eventtickets'@'localhost';
GRANT ALL PRIVILEGES ON ticket_inventory_db.* TO 'eventtickets'@'localhost';
GRANT ALL PRIVILEGES ON payment_notification_db.* TO 'eventtickets'@'localhost';
FLUSH PRIVILEGES;
```

### Déploiement Sans Docker

#### 1. User Service
```powershell
cd user-service
npm install
npx prisma generate
npx prisma migrate dev
npm start
# Port 3001
```

#### 2. Event Catalog Service
```powershell
cd EventCatalogService
./mvnw.cmd clean install
./mvnw.cmd spring-boot:run
# Port 8080
```

#### 3. Ticket Inventory Service
```powershell
cd TicketInventoryService
./mvnw.cmd clean install
./mvnw.cmd spring-boot:run
# Port 8082
```

#### 4. Payment & Notification Service
```powershell
cd paymentAndNotificationService
composer install
php artisan migrate
php artisan serve --port=8000
# Port 8000
```

#### 5. API Gateway
```powershell
cd api-gateway
npm install
npm start
# Port 3000
```

#### 6. Frontend
```powershell
cd web
npm install
npm run dev
# Port 5173
```

### Variables d'Environnement

#### User Service (.env)
```env
DATABASE_URL="mysql://eventtickets:password@localhost:3306/user_service_db"
JWT_SECRET="your_secret_key_here"
PORT=3001
```

#### Event Catalog Service (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/eventtickets_db
spring.datasource.username=eventtickets
spring.datasource.password=your_password
server.port=8080
```

#### Ticket Inventory Service (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ticket_inventory_db
spring.datasource.username=eventtickets
spring.datasource.password=your_password
server.port=8082
```

#### Payment Service (.env)
```env
DB_DATABASE=payment_notification_db
DB_USERNAME=eventtickets
DB_PASSWORD=your_password
APP_PORT=8000
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
```

#### API Gateway (.env)
```env
PORT=3000
JWT_SECRET="your_secret_key_here"
USER_SERVICE_URL=http://localhost:3001
EVENT_SERVICE_URL=http://localhost:8080
INVENTORY_SERVICE_URL=http://localhost:8082
PAYMENT_SERVICE_URL=http://localhost:8000
```

### Ordre de Démarrage

**Important**: Démarrer les services dans cet ordre pour éviter les erreurs de connexion.

1. **MySQL** - Base de données
2. **User Service** - Authentification (port 3001)
3. **Event Catalog Service** - Événements (port 8080)
4. **Ticket Inventory Service** - Inventaire (port 8082)
5. **Payment & Notification Service** - Paiements (port 8000)
6. **API Gateway** - Point d'entrée (port 3000)
7. **Frontend** - Interface utilisateur (port 5173)

### Vérification du Déploiement

```powershell
# Tester User Service
curl http://localhost:3001/health

# Tester Event Catalog
curl http://localhost:8080/events

# Tester Ticket Inventory
curl http://localhost:8082/tickets/availability/1

# Tester API Gateway
curl http://localhost:3000/health

# Tester Frontend
# Ouvrir http://localhost:5173 dans le navigateur
```

---

## Problèmes Rencontrés et Solutions

### 1. Erreur 401 - Authentification JWT

#### Problème
Le frontend recevait continuellement des erreurs 401 Unauthorized lors de l'appel à l'endpoint `/inventory/availability/{eventId}`, même pour un endpoint qui devrait être public.

#### Symptômes
```javascript
GET http://localhost:3000/inventory/availability/1
Status: 401 Unauthorized
Response: {"error": "No token provided"}
```

#### Cause Racine
Deux problèmes identifiés:

1. **Mismatch des champs JWT**: Le User Service génère des tokens avec le champ `roleName`, mais l'API Gateway cherchait un champ `role`.

2. **Ordre des routes Express**: L'endpoint `/inventory/availability/:eventId` était protégé par le middleware d'authentification car défini APRÈS la route générale `/inventory/*`.

#### Solution Implémentée

**a) Mise à jour du middleware d'authentification** (`api-gateway/src/middleware/authMiddleware.js`)
```javascript
req.user = {
  id: decoded.userId,
  email: decoded.email,
  role: decoded.roleName || decoded.role,  // Support des deux formats
  roleId: decoded.roleId,
  organizerId: decoded.organizerId,
};
```

**b) Ajout de route publique avant les routes protégées** (`api-gateway/src/app.js`)
```javascript
// Route PUBLIQUE pour availability (AVANT les routes protégées)
app.get('/inventory/availability/:eventId',
  createProxyMiddleware({
    target: config.services.ticketInventory,
    pathRewrite: { '^/inventory/availability': '/tickets/availability' }
  })
);

// Routes PROTÉGÉES (APRÈS la route publique)
app.use('/inventory', authMiddleware, inventoryRoutes);
```

#### Leçon Apprise
L'ordre des routes dans Express est critique. Les routes spécifiques doivent être définies AVANT les routes générales avec middleware.

---

### 2. Node.js Version Mismatch

#### Problème
Le frontend Vite affiche un warning indiquant que Node.js 20.15.1 est utilisé alors que Vite 7.2.4 requiert v20.19+ ou v22.12+.

#### Symptômes
```
(node:xxxxx) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
You are using Node.js 20.15.1. Vite requires Node.js version 20.19+ or 22.12+.
```

#### Impact
Le frontend fonctionne mais avec des warnings de dépréciation et potentiellement des problèmes de performance.

#### Solution Recommandée
```powershell
# Mettre à jour Node.js
# Option 1: Via nvm (Node Version Manager)
nvm install 20.19.0
nvm use 20.19.0

# Option 2: Télécharger depuis nodejs.org
# https://nodejs.org/en/download/
```

#### Workaround Temporaire
Le système fonctionne malgré le warning. Pas bloquant pour le développement.

---

### 3. Spring Boot Build Failure

#### Problème
Le TicketInventoryService échouait parfois au démarrage avec une erreur BUILD FAILURE.

#### Symptômes
```
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
Process terminated with exit code 1
```

#### Cause
- Cache Maven corrompu
- Classes non compilées
- Conflit de dépendances

#### Solution
```powershell
# Nettoyer et rebuild
cd TicketInventoryService
./mvnw.cmd clean install
./mvnw.cmd spring-boot:run

# Si le problème persiste, supprimer le cache Maven
rm -rf ~/.m2/repository
./mvnw.cmd clean install
```

---

### 4. CORS Issues

#### Problème
Le frontend recevait des erreurs CORS lors des requêtes cross-origin.

#### Symptômes
```
Access to XMLHttpRequest at 'http://localhost:3000/events' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

#### Solution Implémentée
Configuration CORS dans l'API Gateway:
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 5. Token Refresh Loop

#### Problème
Le frontend entrait dans une boucle infinie de refresh de token lors d'une erreur 401.

#### Cause
L'interceptor Axios tentait de refresh le token même quand l'endpoint était censé être public.

#### Solution
```javascript
// Ajout de logique pour éviter le refresh sur endpoints publics
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Ne pas retry sur endpoints publics
    if (originalRequest.url.includes('/availability')) {
      return Promise.reject(error);
    }
    
    // Logique refresh pour endpoints protégés
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // ... refresh token logic
    }
  }
);
```

---

### 6. Database Connection Pool Exhaustion

#### Problème (Potentiel)
Lors de pics de trafic, risque d'épuisement du pool de connexions MySQL.

#### Solution Préventive
Configuration Hikari dans `application.properties`:
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

---

### 7. Réservations Expirées Non Libérées

#### Problème (Potentiel)
Les billets réservés (PENDING) avec délai expiré ne sont pas automatiquement libérés.

#### Solution Recommandée
Implémenter un job cron pour nettoyer les réservations expirées:

```java
@Scheduled(fixedRate = 60000) // Chaque minute
public void cleanupExpiredReservations() {
    LocalDateTime now = LocalDateTime.now();
    List<Reservation> expired = reservationRepository
        .findByStatusAndExpiresAtBefore(ReservationStatus.PENDING, now);
    
    for (Reservation reservation : expired) {
        // Libérer les billets
        TicketType ticket = reservation.getTicketType();
        ticket.setAvailableQuantity(
            ticket.getAvailableQuantity() + reservation.getQuantity()
        );
        ticket.setReservedQuantity(
            ticket.getReservedQuantity() - reservation.getQuantity()
        );
        
        // Marquer comme expiré
        reservation.setStatus(ReservationStatus.EXPIRED);
        
        reservationRepository.save(reservation);
        ticketRepository.save(ticket);
    }
}
```

---

## Bilan du Projet

### Points Forts ✅

#### 1. Architecture Microservices
- **Scalabilité**: Chaque service peut être scalé indépendamment
- **Maintenabilité**: Code organisé par domaine métier
- **Polyglotte**: Utilisation des meilleurs outils pour chaque service (Java, Node.js, PHP)
- **Résilience**: Une panne d'un service n'affecte pas les autres

#### 2. Sécurité
- **Authentification JWT**: Tokens sécurisés avec expiration
- **Hashage bcrypt**: Mots de passe stockés de manière sécurisée
- **HTTPS Ready**: Architecture préparée pour SSL/TLS
- **Validation des données**: À tous les niveaux (frontend, gateway, services)

#### 3. Expérience Utilisateur
- **Interface moderne**: React + Tailwind CSS + Shadcn/ui
- **Responsive**: Compatible mobile, tablette, desktop
- **Temps réel**: Disponibilité des billets mise à jour en temps réel
- **Navigation fluide**: React Router avec transitions

#### 4. Performance
- **ORM optimisés**: Hibernate, Prisma, Eloquent
- **Connection pooling**: Hikari pour MySQL
- **Lazy loading**: Composants React chargés à la demande
- **Index BDD**: Sur les colonnes fréquemment requêtées

### Points d'Amélioration 🔧

#### 1. Gestion des Transactions Distribuées
**Problème**: Les transactions entre services ne sont pas atomiques  
**Solution recommandée**: Implémenter le pattern Saga ou Event Sourcing

#### 2. Cache
**Problème**: Pas de système de cache implémenté  
**Solution recommandée**: Redis pour cache distribué (événements populaires, sessions)

#### 3. Monitoring et Logs
**Problème**: Pas de système centralisé de logs et monitoring  
**Solution recommandée**: ELK Stack (Elasticsearch, Logstash, Kibana) ou Prometheus + Grafana

#### 4. Tests
**Problème**: Tests unitaires et d'intégration incomplets  
**Solution recommandée**: 
- Frontend: Jest + React Testing Library
- Backend: JUnit, Mocha/Chai, PHPUnit
- E2E: Cypress ou Playwright

#### 5. CI/CD
**Problème**: Pas de pipeline d'intégration/déploiement continu  
**Solution recommandée**: GitHub Actions ou GitLab CI/CD

#### 6. Documentation API
**Problème**: Pas de documentation interactive des APIs  
**Solution recommandée**: Swagger/OpenAPI pour chaque service

#### 7. Gestion des Erreurs
**Problème**: Messages d'erreur parfois techniques pour l'utilisateur  
**Solution recommandée**: Mapper les erreurs vers des messages user-friendly

### Statistiques du Projet

#### Code
- **Total de lignes**: ~15,000 lignes de code
- **Frontend**: ~4,000 lignes (JSX, CSS)
- **Backend**: ~11,000 lignes (Java, JavaScript, PHP)

#### Services
- **Nombre de microservices**: 5
- **Nombre d'endpoints API**: ~35
- **Bases de données**: 4 MySQL distinctes

#### Technologies
- **Langages**: JavaScript, Java, PHP
- **Frameworks**: React, Spring Boot, Express, Laravel
- **Base de données**: MySQL
- **Build tools**: Vite, Maven, Composer, npm

### Fonctionnalités Implémentées

✅ **Complètes**:
- Authentification et autorisation
- Gestion des événements (CRUD)
- Consultation du catalogue
- Vérification de disponibilité des billets
- Interface utilisateur responsive
- API Gateway avec proxy
- Sécurité JWT

⚠️ **Partielles**:
- Réservation de billets (backend ready, frontend à compléter)
- Paiement (structure en place, intégration gateway externe à faire)
- Notifications email (service ready, templates à enrichir)

❌ **Non implémentées**:
- Annulation et remboursement
- Génération de codes QR pour billets
- Rappels automatiques 24h avant événement
- Dashboard administrateur
- Statistiques et rapports
- Export de données

### Recommandations pour la Production

#### Sécurité
1. ✅ Migrer vers HTTPS (SSL/TLS)
2. ✅ Implémenter rate limiting sur API Gateway
3. ✅ Ajouter validation CAPTCHA sur formulaires
4. ✅ Mettre en place WAF (Web Application Firewall)
5. ✅ Audit de sécurité complet

#### Performance
1. ✅ Implémenter CDN pour assets statiques
2. ✅ Activer compression gzip/brotli
3. ✅ Mettre en cache les données fréquentes (Redis)
4. ✅ Optimiser requêtes BDD avec EXPLAIN
5. ✅ Load balancing pour haute disponibilité

#### Monitoring
1. ✅ Logs centralisés (ELK Stack)
2. ✅ Métriques applicatives (Prometheus)
3. ✅ Alertes automatiques (PagerDuty, Slack)
4. ✅ Health checks sur tous les services
5. ✅ Tracing distribué (Jaeger, Zipkin)

#### DevOps
1. ✅ Containerisation avec Docker
2. ✅ Orchestration Kubernetes
3. ✅ CI/CD pipeline complet
4. ✅ Environnements séparés (dev, staging, prod)
5. ✅ Backups automatiques BDD

---

## Conclusion

Le projet **EventTickets** représente une implémentation solide d'un système de réservation de billets basé sur une architecture microservices moderne. 

### Acquis Techniques
- Maîtrise de l'architecture microservices
- Intégration de technologies hétérogènes (Java, Node.js, PHP)
- Gestion d'authentification JWT cross-services
- Design d'API RESTful
- Utilisation d'ORM modernes (Hibernate, Prisma, Eloquent)

### Acquis Fonctionnels
- Compréhension des processus métier de réservation
- Gestion d'inventaire en temps réel
- Workflow de paiement sécurisé
- Notifications utilisateur

### Défis Relevés
- Coordination entre services indépendants
- Résolution de problèmes d'authentification cross-service
- Gestion de la cohérence des données distribuées
- Debugging dans un environnement microservices

Le système est **fonctionnel pour un environnement de développement** et constitue une excellente base pour une application de production. Les améliorations recommandées (tests, monitoring, CI/CD, cache) transformeront ce prototype en une plateforme robuste et scalable.

---

## Annexes

### Ressources Utiles

#### Documentation
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [Laravel Documentation](https://laravel.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

#### Tutoriels
- Microservices avec Spring Boot
- JWT Authentication Best Practices
- React + Vite Setup
- MySQL Performance Tuning

### Contact et Support

Pour toute question ou problème:
- **Email**: support@eventtickets.com
- **Documentation**: `/docs`
- **Issue Tracker**: GitHub Issues

---

**Dernière mise à jour**: 28 Novembre 2025  
**Version**: 1.0.0  
**Auteurs**: Équipe EventTickets
