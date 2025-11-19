package com.acme.tickets.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuration de sécurité pour le service.
 * ATTENTION: Configuration permissive pour développement. 
 * TODO: Implémenter JWT/OAuth2 pour la production.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)  // Désactiver CSRF pour API REST
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/tickets/**",
                    "/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/actuator/**"
                ).permitAll()
                .anyRequest().permitAll()  // TODO: Remplacer par .authenticated()
            );

        return http.build();
    }
}
