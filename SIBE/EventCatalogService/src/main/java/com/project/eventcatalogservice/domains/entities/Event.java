package com.project.eventcatalogservice.domains.entities;

import com.project.eventcatalogservice.domains.enums.EventStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Date date;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Enumerated
    private EventStatus status;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private Organizer organizer;

    @ManyToOne
    @JoinColumn(name = "venue_id")
    private Venue venue;

    @ManyToMany
    @JoinTable(name = "event_artist", joinColumns = @JoinColumn(name = "event_id"), inverseJoinColumns = @JoinColumn(name = "artist_id")
    )
    private List<Artist> artists;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private List<TicketType> ticketTypes;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private List<EventImage> images;


}
