package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.Venue;
import com.project.eventcatalogservice.repositories.VenueRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VenueService {
    private final VenueRepository venueRepository;


    public List<Venue> getAll() {
        return venueRepository.findAllNotDeleted();
    }

    public Venue getById(Long id) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Venue not found"));
        if (venue.isDeleted()) throw new EntityNotFoundException("Venue deleted");
        return venue;
    }

    public Venue create(Venue venue) {
        venue.setDeleted(false);
        return venueRepository.save(venue);
    }

    public Venue update(Long id, Venue details) {
        Venue venue = getById(id);
        venue.setName(details.getName());
        venue.setAddress(details.getAddress());
        venue.setCity(details.getCity());
        venue.setCapacity(details.getCapacity());
        return venueRepository.save(venue);
    }

    public void delete(Long id) {
        Venue venue = getById(id);
        venue.setDeleted(true);
        venueRepository.save(venue);
    }
}
