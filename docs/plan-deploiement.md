# Plan de deploiement EventTickets

## Objectif du document
- Fournir une vision detaillee du passage en production pour la plateforme EventTickets (SIBE).
- Rassurer les parties prenantes sur les responsabilites, le calendrier et les pre-requis techniques.
- Servir de reference pendant les phases de preparation, de repetition et de bascule finale.

## Portee
- Microservices cibles : `EventCatalogService`, `TicketInventoryService`, `paymentAndNotificationService`, `user-service`.
- Composants communs : base de donnees MySQL, bus de messages (optionnel a ce stade), outil de supervision.
- Environnements : Integration (INT), Recette (UAT), Production (PROD).

## Pre-requis generaux
- Infrastructure cloud ou on-premise provisionnee (VMs ou conteneurs) avec les systemes d exploitation compatibles :
  - Services Java : OS Linux/Windows Server avec JDK 17 et Maven Wrapper.
  - Service Laravel : OS Linux avec PHP 8.2, Composer, Node.js 18+.
  - Service Node.js : OS Linux/Windows Server avec Node.js 18+, npm, Prisma CLI.
- Acces reseau securise entre les services et la base de donnees MySQL (ports 3306, 8080, 8081, 4001, 8000 par defaut).
- Secrets applicatifs stockes dans un coffre-fort (Vault, AWS Secrets Manager, Azure Key Vault...).
- Jeux de donnees anonymises pour les tests de migration.
- Outils de supervision disponibles (Elastic, Grafana, New Relic...) et alerting configure.

## Roles et responsabilites
- **Chef de projet** : valide le planning, coordonne les equipes et arbitre les decisions critiques.
- **Responsable DevOps** : prepare les infrastructures, pipelines CI/CD, scripts IaC, surveillance post-deploiement.
- **Developpeurs microservices** : assurent les livrables applicatifs, tests automatises et support post-mise en production.
- **DBA** : gere la configuration MySQL, execute les scripts de migration, valide les performances et les sauvegardes.
- **Securite/Infra** : audite les configurations (firewalls, certificats TLS, gestion des utilisateurs systeme).
- **Representant metier** : valide le bon fonctionnement en UAT et signe le go/no-go final.
- **Support applicatif** : couvre le suivi post-bascule et gere les incidents de production.

## Plan detaille de deploiement

### 1. Preparation (J-21 a J-14)
- Finaliser les developpements et gel des features a deployer.
- Executer l ensemble des tests automatises et editer le rapport de qualite.
- Valider les pre-requis materiels/logiques : dimensionnement VMs, stockage, certificats TLS.
- Rediger ou mettre a jour les playbooks d exploitation et de rollback.

### 2. Provisionnement infrastructure (J-14 a J-10)
- Deployer les environnements cibles via IaC (Terraform, Ansible) ou scripts manuels controles.
- Configurer les reseaux (VPC, sous-reseaux, groupes de securite, pare-feu).
- Installer les dependances systemes : Java 17, PHP 8.2, Node.js 18+, outils CLI.
- Mettre en place le serveur MySQL et creer les schemas dedies a chaque service.

### 3. Installation applicative et configuration (J-10 a J-7)
- Cloner le repository sur chaque environnement.
- Renseigner les fichiers `.env` / `application.properties` avec les secrets et URLs definitifs.
- Executer les commandes d installation :
  - `mvnw.cmd clean package` (services Spring Boot).
  - `composer install`, `npm install`, `php artisan key:generate` (Laravel).
  - `npm install`, `npm run prisma:generate` (Node.js).
- Configurer les services systemd ou conteneurs (Docker/Kubernetes) pour chaque microservice.

### 4. Migration des donnees et initialisation (J-7 a J-5)
- Sauvegarder l existant si mise a jour d un systeme precedent.
- Executer les migrations :
  - Spring Boot : scripts SQL ou Flyway (selon strategie retenue).
  - Laravel : `php artisan migrate --force`.
  - Prisma : `npm run prisma:migrate deploy`.
- Charger les donnees de reference (catalogues, utilisateurs de test, parametres).

### 5. Tests d integration et UAT (J-5 a J-2)
- Lancer des tests de bout en bout couvrant la creation d evenements, la reservation de billets, le paiement et l envoi de notifications.
- Verifier les logs, performances, alertes et seuils de supervision.
- Realiser une repetition generale de la bascule (dry-run) et documenter la duree.
- Obtenir la validation du representant metier (PV de recette installe).

### 6. Deploiement en production (Jour J)
- 08h00 : Reunion de lancement et validation du go.
- 08h15 : Mise en maintenance de l ancien systeme (si applicable).
- 08h30 : Deploiement des artefacts applicatifs (CI/CD ou scripts) sur PROD.
- 09h00 : Execution des migrations PROD et verification des indices.
- 09h30 : Demarrage des services et verification des points de sante `/actuator/health`, `/health`.
- 10h00 : Jeux de tests rapides (smoke tests) effectues par l equipe QA.
- 10h30 : Ouverture progressive aux utilisateurs finaux / traffic live.

### 7. Post-deploiement (J+1 a J+7)
- Surveillance rapprochee des logs, alertes et metriques.
- Reunions quotidiennes de suivi (15 minutes) pour remonter les incidents.
- Documentation des problemes rencontres et plans d action.
- Passage en mode maintenance standard apres stabilisation.

## Planning synthetique
- Semaine 1 (J-21 a J-14) : Preparation et gel des developpements.
- Semaine 2 (J-14 a J-7) : Infrastructure + installation applicative.
- Semaine 3 (J-7 a J-2) : Migrations + tests + repetition generale.
- Jour J : Bascule en production.
- Semaine post-J : Stabilisation et transfert au support.

## Gestion des risques et plans de contingence
- **Indisponibilite infrastructure** : plan de rollback vers l ancien cluster ou bascule vers region secondaire.
- **Echec migration SQL** : script de rollback, snapshot base de donnees pris avant bascule.
- **Non conformite fonctionnelle** : maintien de l ancien systeme en mode lecture seule et repli rapide.
- **Incident securite** : alerting SOC, revocation des secrets, plan de reinitialisation des cles.

## Communication
- Canaux : Slack/Teams (canal projet), emails quotidiens, tableau de bord temps reel.
- Points de contact : numéros d astreinte DevOps, DBA, Support applicatif.
- Rapports post-bascule : compte-rendu J+1, bilan de stabilisation J+7.

## Validation
- Ce plan doit etre valide par le chef de projet, le responsable DevOps et le representant metier avant toute mise en production.
- Les eventuelles deviations seront documentees dans un avenant et approuvees par les memes parties.
