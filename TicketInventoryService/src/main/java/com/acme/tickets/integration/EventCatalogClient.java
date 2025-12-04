package com.acme.tickets.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class EventCatalogClient {

    private static final Logger logger = LoggerFactory.getLogger(EventCatalogClient.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final String baseUrl;

    public EventCatalogClient(@Value("${eventcatalog.service.base-url}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Récupère les détails de l'événement via l'API Gateway.
     * Retourne un Map contenant au minimum 'category' et 'ticketTypes' si disponibles.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Map<String, Object> getEventById(Long eventId) {
        String url = baseUrl + "/events/" + eventId;
        try {
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            return resp.getBody();
        } catch (Exception ex) {
            logger.error("[EventCatalogClient] échec récupération eventId={}: {}", eventId, ex.getMessage());
            return Map.of();
        }
    }
}
