package com.acme.tickets.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration OpenAPI/Swagger pour la documentation de l'API.
 * Définit les métadonnées et les schémas de sécurité (Bearer JWT).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ticketInventoryOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Ticket Inventory Service API")
                .description("""
                    API de gestion des inventaires de tickets et des réservations pour les événements.                
                    **Idempotence:** Les opérations de réservation supportent le header `Idempotency-Key`.
                    """)
                .version("1.0.0")
                .contact(new Contact()
                    .name("Équipe EventTickets")
                    .email("contact@eventtickets.com")
                    .url("https://eventtickets.com"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
            .servers(List.of(
                new Server()
                    .url("http://localhost:8082")
                    .description("Serveur de développement"),
                new Server()
                    .url("https://api.eventtickets.com")
                    .description("Serveur de production")
            ))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT Bearer token (TODO: Implémenter l'authentification)")));
    }
}
