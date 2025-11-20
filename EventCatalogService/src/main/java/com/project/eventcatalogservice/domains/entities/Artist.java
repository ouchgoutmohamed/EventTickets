package com.project.eventcatalogservice.domains.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class Artist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String genre ;
    private String country ;

    private boolean deleted;

    @ManyToMany(mappedBy = "artists")
    private List<Event> events;
}
