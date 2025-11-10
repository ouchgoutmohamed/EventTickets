package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.domains.entities.EventImage;
import com.project.eventcatalogservice.services.EventImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/event-images")
@RequiredArgsConstructor
public class EventImageController {

    private final EventImageService eventImageService;

    @GetMapping
    public List<EventImage> getAll() {
        return eventImageService.getAll();
    }

    @GetMapping("/{id}")
    public EventImage getById(@PathVariable Long id) {
        return eventImageService.getById(id);
    }

    @PostMapping
    public EventImage create(@RequestBody EventImage image) {
        return eventImageService.create(image);
    }

    @PutMapping("/{id}")
    public EventImage update(@PathVariable Long id, @RequestBody EventImage image) {
        return eventImageService.update(id, image);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        eventImageService.delete(id);
    }
}
