package com.project.eventcatalogservice.domains.entities;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class Organizer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    @Column(unique = true ,nullable = false)
    private String email;

    @Column(unique = true ,nullable = false)
    private String phone;

    @OneToMany(mappedBy = "organizer" , cascade = CascadeType.ALL)
    private List<Event> events ;


}
