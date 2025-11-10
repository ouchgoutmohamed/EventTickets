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
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private boolean deleted ;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Event> events;
}
