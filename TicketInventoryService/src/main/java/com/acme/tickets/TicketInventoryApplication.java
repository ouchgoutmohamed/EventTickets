package com.acme.tickets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Application principale du service de gestion d'inventaire de tickets.
 */
@SpringBootApplication
@EnableScheduling
public class TicketInventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketInventoryApplication.class, args);
    }
}
