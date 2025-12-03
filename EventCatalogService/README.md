# 🎫 EventCatalog Service

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**EventCatalog Service** est le microservice de gestion du catalogue d'événements pour la plateforme EventTickets. Il permet aux organisateurs de créer, gérer et publier leurs événements, et aux utilisateurs de consulter, rechercher et filtrer les événements disponibles.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Sécurité](#-sécurité)
- [Tests](#-tests)
- [Structure du projet](#-structure-du-projet)
- [Contribuer](#-contribuer)

---

## ✨ Fonctionnalités

### 🎯 Gestion des événements
- ✅ **Création d'événements** - Les organisateurs peuvent créer des événements avec toutes les informations nécessaires
- ✅ **Modification d'événements** - Mise à jour des détails (titre, description, date, lieu, etc.)
- ✅ **Suppression d'événements** - Soft delete pour conserver l'historique
- ✅ **Gestion des statuts** - DRAFT, PUBLISHED, OPEN_FOR_BOOKING, SOLDOUT, POSTPONED, CANCELLED, COMPLETED

### 🔍 Recherche et filtrage
- ✅ **Recherche par mot-clé** - Recherche dans le titre, la description et le lieu
- ✅ **Filtrage par catégorie** - MUSIC, SPORTS, CONFERENCE, THEATRE, FESTIVAL
- ✅ **Filtrage par statut** - Afficher uniquement les événements publiés, annulés, etc.
- ✅ **Filtrage par date** - Recherche dans une plage de dates spécifique
- ✅ **Liste complète** - Récupération de tous les événements disponibles

### 📊 Statistiques pour organisateurs
- ✅ **Statistiques globales** - Total d'événements, capacité totale, événements par statut
- ✅ **Statistiques par catégorie** - Nombre d'événements et capacité par catégorie
- ✅ **Timeline des événements** - Distribution temporelle (passés, aujourd'hui, à venir, cette semaine, ce mois)

### 🎨 Fonctionnalités avancées
- ✅ **Multi-artistes** - Associer plusieurs artistes à un événement
- ✅ **Types de billets** - Définir différents types de billets (Standard, VIP, etc.)
- ✅ **Galerie d'images** - Plusieurs images par événement
- ✅ **Gestion des lieux** - Informations complètes sur les venues (nom, adresse, ville, capacité)

---

## 🏗️ Architecture

EventCatalog Service suit une **architecture en couches** (layered architecture) avec une séparation claire des responsabilités :

```
┌─────────────────────────────────────┐
│         API Gateway                 │
│       (Port 3000)                   │
└──────────────┬──────────────────────┘
               │ JWT Authentication
               │
┌──────────────▼──────────────────────┐
│     EventCatalog Service            │
│         (Port 8080)                 │
├─────────────────────────────────────┤
│  Controllers (API REST)             │
│  ├─ EventController (11 endpoints)  │
│  ├─ StatsController (3 endpoints)   │
│  └─ CategoryController (1 endpoint) │
├─────────────────────────────────────┤
│  Services (Business Logic)          │
│  ├─ EventService                    │
│  ├─ StatsService                    │
│  └─ CategoryService                 │
├─────────────────────────────────────┤
│  Repositories (Data Access)         │
│  ├─ EventRepository                 │
│  ├─ OrganizerRepository             │
│  ├─ VenueRepository                 │
│  ├─ ArtistRepository                │
│  ├─ TicketTypeRepository            │
│  └─ EventImageRepository            │
├─────────────────────────────────────┤
│  Entities (Domain Model)            │
│  ├─ Event                           │
│  ├─ Organizer                       │
│  ├─ Venue                           │
│  ├─ Artist                          │
│  ├─ TicketType                      │
│  ├─ EventImage                      │
│  └─ Category                        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        MySQL Database               │
│         (sibe_db)                   │
└─────────────────────────────────────┘
```

### Entités principales

#### Event
```java
{
  "id": Long,
  "title": String,
  "description": String,
  "date": Date,
  "startTime": LocalDateTime,
  "endTime": LocalDateTime,
  "status": EventStatus,
  "category": CategoryType,
  "venue": Venue,
  "organizer": Organizer,
  "artists": List<Artist>,
  "ticketTypes": List<TicketType>,
  "images": List<EventImage>,
  "deleted": Boolean
}
```

---

## 🛠️ Technologies

### Backend
- **Java 17** - Langage de programmation
- **Spring Boot 3.5.7** - Framework principal
- **Spring Data JPA** - Accès aux données
- **Spring Security 6.5.6** - Sécurité et authentification JWT
- **Hibernate** - ORM (Object-Relational Mapping)
- **MySQL 8.0** - Base de données

### Documentation & Outils
- **SpringDoc OpenAPI 2.8.10** - Documentation API automatique (Swagger)
- **Lombok** - Réduction du code boilerplate
- **Maven** - Gestion des dépendances

### Qualité & Tests
- **JUnit 5** - Tests unitaires
- **Mockito** - Mocking framework
- **JaCoCo** - Couverture de code
- **Checkstyle** - Analyse statique du code

### Sécurité
- **Snyk** - Analyse de vulnérabilités (0 CVE détectées)
- **JWT (JSON Web Tokens)** - Authentification et autorisation

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Java 17** ou supérieur ([Télécharger](https://www.oracle.com/java/technologies/downloads/#java17))
- **Maven 3.8+** ([Télécharger](https://maven.apache.org/download.cgi))
- **MySQL 8.0** ([Télécharger](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Télécharger](https://git-scm.com/downloads))

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/ouchgoutmohamed/EventTickets.git
cd EventTickets/EventCatalogService
```

### 2. Créer la base de données MySQL

```sql
CREATE DATABASE sibe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env` et configurez vos paramètres :

```bash
cp .env.example .env
```

Modifiez `.env` avec vos informations :

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sibe_db
DB_USERNAME=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
```

### 4. Installer les dépendances

```bash
./mvnw clean install
```

### 5. Lancer l'application

```bash
./mvnw spring-boot:run
```

L'application sera accessible sur **http://localhost:8080**

---

## ⚙️ Configuration

### Fichiers de configuration

- **`.env`** - Variables d'environnement (NE PAS COMMIT)
- **`.env.example`** - Template des variables d'environnement
- **`application.properties`** - Configuration Spring Boot

### Ports par défaut

| Service | Port |
|---------|------|
| EventCatalog Service | 8080 |
| API Gateway | 3000 |
| MySQL Database | 3306 |

### Configuration de la base de données

Le service utilise **Hibernate** avec la stratégie `update` pour la gestion du schéma :

```properties
spring.jpa.hibernate.ddl-auto=update
```

⚠️ **En production**, changez cette valeur en `validate` et utilisez des migrations (Flyway/Liquibase).

---

## 💻 Utilisation

### Accéder à la documentation Swagger

Une fois le service démarré, accédez à l'interface Swagger UI :

```
http://localhost:8080/swagger-ui.html
```

### Endpoints disponibles

#### EventController - Gestion des événements

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/events/create` | Créer un événement | 🔒 JWT |
| PUT | `/events/{id}` | Modifier un événement | 🔒 JWT |
| DELETE | `/events/{id}` | Supprimer un événement | 🔒 JWT |
| GET | `/events/{id}` | Récupérer un événement | 🔓 Public |
| GET | `/events/list-events` | Lister tous les événements | 🔓 Public |
| GET | `/events/my-events` | Mes événements | 🔒 JWT |
| GET | `/events/search?keyword=` | Rechercher des événements | 🔓 Public |
| GET | `/events/category/{category}` | Filtrer par catégorie | 🔓 Public |
| GET | `/events/status/{status}` | Filtrer par statut | 🔓 Public |
| GET | `/events/date-range?start=&end=` | Filtrer par dates | 🔓 Public |
| PATCH | `/events/{id}/status?status=` | Changer le statut | 🔒 JWT |

#### StatsController - Statistiques

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/stats/organizer` | Statistiques globales | 🔒 JWT |
| GET | `/stats/organizer/categories` | Stats par catégorie | 🔒 JWT |
| GET | `/stats/organizer/timeline` | Timeline des événements | 🔒 JWT |

#### CategoryController - Catégories

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/categories` | Liste des catégories | 🔓 Public |

### Exemples d'utilisation

#### Créer un événement

```bash
curl -X POST http://localhost:8080/events/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Concert de Jazz",
    "description": "Soirée jazz exceptionnelle",
    "date": "2025-12-25T00:00:00Z",
    "startTime": "2025-12-25T20:00:00",
    "endTime": "2025-12-25T23:00:00",
    "status": "DRAFT",
    "category": "MUSIC",
    "venue": {
      "name": "Grand Théâtre",
      "address": "123 Rue de la Musique",
      "city": "Paris",
      "capacity": 500
    },
    "artists": [
      {
        "name": "John Doe Quartet",
        "genre": "Jazz",
        "country": "USA"
      }
    ],
    "ticketTypes": [
      {
        "name": "Standard",
        "price": 25.00,
        "quantity": 300
      },
      {
        "name": "VIP",
        "price": 50.00,
        "quantity": 100
      }
    ],
    "images": [
      {
        "url": "https://example.com/image1.jpg"
      }
    ]
  }'
```

#### Rechercher des événements

```bash
# Recherche par mot-clé
curl http://localhost:8080/events/search?keyword=concert

# Filtrer par catégorie
curl http://localhost:8080/events/category/MUSIC

# Filtrer par plage de dates
curl "http://localhost:8080/events/date-range?start=2025-12-01&end=2025-12-31"
```

---

## 📚 API Documentation

### Swagger/OpenAPI

L'API est entièrement documentée avec Swagger. Accédez à :

- **Swagger UI** : http://localhost:8080/swagger-ui.html
- **OpenAPI JSON** : http://localhost:8080/v3/api-docs

### Authentification JWT

Les endpoints protégés nécessitent un **Bearer Token JWT** dans le header :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Le token est fourni par le **User Service** après connexion et contient :
- `userId` - ID de l'utilisateur
- `email` - Email de l'utilisateur
- `role` - Rôle (ORGANIZER, ADMIN, USER)

---

## 🔒 Sécurité

### Authentification & Autorisation

- **JWT (JSON Web Tokens)** - Authentification stateless
- **Spring Security** - Gestion des autorisations
- **CORS** - Configuration pour les appels depuis le frontend

### Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| **ORGANIZER** | Créer, modifier, supprimer ses propres événements |
| **ADMIN** | Gérer tous les événements |
| **USER** | Consulter les événements publics |

### Sécurité des dépendances

- ✅ **0 vulnérabilités** détectées (vérifié avec Snyk)
- ✅ Dépendances à jour (Spring Boot 3.5.7, SpringDoc 2.8.10)

---

## 🧪 Tests

### Lancer les tests

```bash
# Tous les tests
./mvnw test

# Tests avec couverture JaCoCo
./mvnw clean test jacoco:report
```

### Voir le rapport de couverture

```bash
# Ouvrir le rapport HTML
open target/site/jacoco/index.html
```

### Structure des tests

```
src/test/java/
├── api/controllers/          # Tests des contrôleurs
├── services/                 # Tests des services
│   ├── CategoryServiceTest.java
│   ├── VenueServiceTest.java
│   └── ArtistServiceTest.java
└── EventCatalogServiceApplicationTests.java
```

---

## 📂 Structure du projet

```
EventCatalogService/
├── src/
│   ├── main/
│   │   ├── java/com/project/eventcatalogservice/
│   │   │   ├── api/
│   │   │   │   ├── controllers/         # Contrôleurs REST
│   │   │   │   │   ├── EventController.java
│   │   │   │   │   ├── StatsController.java
│   │   │   │   │   └── CategoryController.java
│   │   │   │   ├── requests/            # DTOs de requête
│   │   │   │   │   ├── CreateEventRequest.java
│   │   │   │   │   └── UpdateEventRequest.java
│   │   │   │   └── responses/           # DTOs de réponse
│   │   │   │       ├── EventResponse.java
│   │   │   │       ├── OrganizerStatsResponse.java
│   │   │   │       └── EventCategoryStatsResponse.java
│   │   │   ├── config/                  # Configuration
│   │   │   │   └── OpenApiConfig.java
│   │   │   ├── domains/
│   │   │   │   ├── entities/            # Entités JPA
│   │   │   │   │   ├── Event.java
│   │   │   │   │   ├── Organizer.java
│   │   │   │   │   ├── Venue.java
│   │   │   │   │   ├── Artist.java
│   │   │   │   │   ├── TicketType.java
│   │   │   │   │   └── EventImage.java
│   │   │   │   └── enums/               # Énumérations
│   │   │   │       ├── EventStatus.java
│   │   │   │       └── CategoryType.java
│   │   │   ├── repositories/            # Repositories JPA
│   │   │   │   ├── EventRepository.java
│   │   │   │   ├── OrganizerRepository.java
│   │   │   │   ├── VenueRepository.java
│   │   │   │   ├── ArtistRepository.java
│   │   │   │   ├── TicketTypeRepository.java
│   │   │   │   └── EventImageRepository.java
│   │   │   ├── security/                # Sécurité JWT
│   │   │   │   ├── CustomUserDetails.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── SecurityConfig.java
│   │   │   ├── services/                # Services métier
│   │   │   │   ├── EventService.java
│   │   │   │   ├── StatsService.java
│   │   │   │   └── CategoryService.java
│   │   │   └── EventCatalogServiceApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/                            # Tests
├── .env.example                         # Template variables d'environnement
├── .gitignore
├── pom.xml                              # Dépendances Maven
└── README.md
```

---

## 📊 Statistiques du projet

- **Lignes de code** : ~4,500 lignes
- **Entités** : 7 entités JPA
- **Endpoints API** : 15 endpoints REST
- **Tests unitaires** : 24 tests
- **Couverture de code** : En cours de mesure
- **Vulnérabilités** : 0 CVE détectées

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir une Pull Request**

### Standards de code

- Respecter les conventions Java (CamelCase, etc.)
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les méthodes publiques avec Javadoc
- Vérifier avec Checkstyle (`mvn checkstyle:check`)

---

## 📝 License

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Auteurs

- **Mohamed Ouchgout** - [@ouchgoutmohamed](https://github.com/ouchgoutmohamed)

---

## 📞 Support

Pour toute question ou problème :

- 📧 Email : support@eventtickets.com
- 🐛 Issues : [GitHub Issues](https://github.com/ouchgoutmohamed/EventTickets/issues)

---

## 🔗 Liens utiles

- [Documentation Spring Boot](https://spring.io/projects/spring-boot)
- [Documentation Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Documentation Swagger/OpenAPI](https://swagger.io/docs/)
- [Guide JWT](https://jwt.io/introduction)

---

<div align="center">
  <sub>Built with ❤️ by the EventTickets Team</sub>
</div>
