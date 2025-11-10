package com.project.eventcatalogservice.domains.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class TicketType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticketName ;
    private double price ;
    private int quantity ;

    private boolean deleted;

    @ManyToOne
    @JoinColumn(name="event_id")
    private Event event;
}
