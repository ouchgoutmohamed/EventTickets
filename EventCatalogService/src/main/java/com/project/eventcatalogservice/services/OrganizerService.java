package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.Organizer;
import com.project.eventcatalogservice.repositories.OrganizerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrganizerService {


    private final OrganizerRepository organizerRepository;

    public Organizer getById(Long id) {
        Organizer organizer = organizerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Organizer not found"));
        if (organizer.isDeleted()) throw new EntityNotFoundException("Organizer deleted");
        return organizer;
    }

    public Organizer create(Organizer organizer) {
        organizer.setDeleted(false);
        return organizerRepository.save(organizer);
    }

    public Organizer update(Long id, Organizer details) {
        Organizer organizer = getById(id);
        organizer.setFirstName(details.getFirstName());
        organizer.setLastName(details.getLastName());
        organizer.setEmail(details.getEmail());
        organizer.setPhone(details.getPhone());
        return organizerRepository.save(organizer);
    }

    public void delete(Long id) {
        Organizer organizer = getById(id);
        organizer.setDeleted(true);
        organizerRepository.save(organizer);
    }
}
