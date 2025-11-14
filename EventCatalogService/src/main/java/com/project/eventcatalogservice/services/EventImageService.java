package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.EventImage;
import com.project.eventcatalogservice.repositories.EventImageRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventImageService {

    private final EventImageRepository eventImageRepository;


    public List<EventImage> getAll() {
        return eventImageRepository.findAllNotDeleted();
    }

    public EventImage getById(Long id) {
        EventImage img = eventImageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Image not found"));
        if (img.isDeleted()) throw new EntityNotFoundException("Image deleted");
        return img;
    }

    public EventImage create(EventImage image) {
        image.setDeleted(false);
        return eventImageRepository.save(image);
    }

    public EventImage update(Long id, EventImage details) {
        EventImage img = getById(id);
        img.setUrl(details.getUrl());
        img.setAltText(details.getAltText());
        return eventImageRepository.save(img);
    }

    public void delete(Long id) {
        EventImage img = getById(id);
        img.setDeleted(true);
        eventImageRepository.save(img);
    }
}
