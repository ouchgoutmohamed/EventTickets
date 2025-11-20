package com.project.eventcatalogservice.domains.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class EventImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String url;
    private String altText ;

    private boolean deleted;

    @ManyToOne
    @JoinColumn(name= "event_id")
    private Event event;
}
