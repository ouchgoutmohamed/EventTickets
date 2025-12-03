package com.project.eventcatalogservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "EventCatalog Service API",
        version = "1.0.0",
        description = """
            # API de Gestion des Événements
            
            Cette API permet de gérer un catalogue d'événements complet avec :
            
            ## Fonctionnalités principales
            - ✅ Création et gestion d'événements
            - ✅ Filtrage par catégorie, statut et dates
            - ✅ Recherche full-text
            - ✅ Gestion des organisateurs, lieux et artistes
            - ✅ Authentification JWT
            - ✅ Statistiques et analytics
            
            ## Authentification
            La plupart des endpoints de modification nécessitent un token JWT.
            
            Pour obtenir un token :
            1. Connectez-vous via le service user-service : `POST http://localhost:3001/api/auth/login`
            2. Récupérez le token dans la réponse
            3. Cliquez sur "Authorize" en haut à droite
            4. Entrez : `Bearer votre_token_ici`
            
            ## Roles
            - **USER** : Consultation des événements
            - **ORGANIZER** : Création et gestion de ses propres événements
            - **ADMIN** : Accès complet à tous les événements
            
            ## Environnements
            - **Développement** : http://localhost:8080
            - **Production** : https://api.eventtickets.com
            """,
        contact = @Contact(
            name = "EventTickets Support",
            email = "support@eventtickets.com",
            url = "https://eventtickets.com/support"
        ),
        license = @License(
            name = "MIT License",
            url = "https://opensource.org/licenses/MIT"
        )
    ),
    servers = {
        @Server(
            url = "http://localhost:8080",
            description = "Serveur de développement local"
        ),
        @Server(
            url = "https://api.eventtickets.com",
            description = "Serveur de production"
        )
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "Entrez votre token JWT obtenu depuis le service d'authentification"
)
public class OpenApiConfig {
}
