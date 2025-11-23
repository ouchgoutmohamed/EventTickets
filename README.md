# EventTickets - Plateforme Microservices

## Apercu
- EventTickets (SIBE) est une plateforme modulaire destinee a la gestion de billetterie evenementielle.
- L architecture repose sur plusieurs microservices independants pour favoriser la scalabilite et les evolutions futures.
- Chaque service expose ses propres APIs REST et peut etre deployee de maniere autonome.

## Architecture
- `api-gateway` (Node.js, Express) : point d'entree unique pour tous les services backend, gestion du routage et de l'authentification JWT.
- `EventCatalogService` (Java 17, Spring Boot 3.5) : gestion du catalogue d evenements, metadata et recherche.
- `TicketInventoryService` (Java 17, Spring Boot 3.5) : suivi des stocks de billets et reservation.
- `paymentAndNotificationService` (PHP 8.2, Laravel 12) : orchestration des paiements et envoi des notifications.
- `user-service` (Node.js, Express, Prisma) : authentification, profils et gestion des comptes.
- `frontend` (React, Vite) : interface utilisateur web communiquant uniquement avec l'api-gateway.

## Prerequis
- Java Development Kit 17 et Maven Wrapper (`mvnw.cmd`) pour les services Spring Boot.
- PHP 8.2, Composer et une base de donnees MySQL pour le service Laravel.
- Node.js 18+, npm et Prisma CLI pour le service utilisateur.
- Serveur MySQL disponible (local ou conteneur) pour les besoins de persistence.
- Git et un outil de gestion d environnements (.env) pour centraliser les secrets.

## Configuration initiale
- Cloner le repository puis se positionner dans chaque dossier de microservice selon les besoins.
- Creer les fichiers d environnement :
  - API Gateway : dupliquer `api-gateway/.env.example` en `.env`, configurer les URLs des services backend et le JWT_SECRET (doit correspondre au user-service).
  - Spring Boot : completer `EventCatalogService/src/main/resources/application.properties` et `TicketInventoryService/src/main/resources/application.properties` avec les proprietes `spring.datasource.*` cibles (exemple : `spring.datasource.url=jdbc:mysql://localhost:3306/event_catalog`).
  - Laravel : dupliquer `.env.example` en `.env`, renseigner `DB_*`, `QUEUE_CONNECTION`, `MAIL_*` et les cles de paiement.
  - Node.js : creer `user-service/.env` avec `DATABASE_URL="mysql://user:password@localhost:3306/user_service"` et les variables JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`).
  - Frontend : dupliquer `frontend/.env.example` en `.env`, configurer `VITE_API_BASE_URL` pour pointer vers l'api-gateway (http://localhost:3000/api).
- Executer les migrations quand elles existent (Laravel `php artisan migrate`, Prisma `npm run prisma:migrate`).

## D emarrage des microservices

**Important:** Demarrer les services dans l'ordre suivant pour garantir la disponibilite des dependances :

1. **Bases de donnees MySQL** - S'assurer que MySQL est demarre et accessible
2. **user-service** (port 3001)
   - Commandes : `cd user-service`, `npm install`, `npm run prisma:generate`, `npm run dev`.
   - Endpoints disponibles : `/` (verifie le service) et `/health`.
3. **TicketInventoryService** (port 8082)
   - Commande : `cd TicketInventoryService` puis `mvnw.cmd spring-boot:run` (Windows) ou `./mvnw spring-boot:run` (Linux/Mac).
4. **api-gateway** (port 3000)
   - Commandes : `cd api-gateway`, `npm install`, `npm run dev`.
   - Point d'entree unique pour le frontend.
5. **frontend** (port 5173)
   - Commandes : `cd frontend`, `npm install`, `npm run dev`.
   - Accessible sur http://localhost:5173

Services optionnels :
- `EventCatalogService` (port 8080)
  - Commande : `cd EventCatalogService` puis `mvnw.cmd spring-boot:run`.
- `paymentAndNotificationService` (port 8000)
  - Commandes : `cd paymentAndNotificationService`, `composer install`, `npm install`, `php artisan serve`.
  - Pour lancer la chaine temps reel : `composer run dev` (serveur HTTP, file de jobs et Vite en mode dev).

## Tests et qualite
- Spring Boot : `mvnw.cmd test` dans les dossiers `EventCatalogService` et `TicketInventoryService`.
- Laravel : `php artisan test` ou `composer run test`.
- Node.js : ajouter des suites Jest ou Vitest (placeholder actuellement aucune suite implemente).
- Integrer une pipeline CI ulterieurement pour coordonner les tests sur l ensemble des services.

## Suivi et prochaines etapes
- ✅ API Gateway implemente comme point d'entree unique pour tous les services.
- ✅ Integration frontend du TicketInventoryService via l'API Gateway.
- Ajouter des modules metiers (controllers, services, repositories) dans chaque microservice pour couvrir les cas d usage billets, paiement et notifications.
- Mettre en place la communication asynchrone (RabbitMQ, Kafka) pour fiabiliser les notifications.
- Preparer des conteneurs Docker individuels et un compose.yaml pour faciliter le demarrage local.
- Documenter les contrats API (OpenAPI/Swagger) et les scenarios Postman pour faciliter les tests d integration.
