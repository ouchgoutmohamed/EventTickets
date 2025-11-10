package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.domains.entities.Organizer;
import com.project.eventcatalogservice.services.OrganizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/organizers")
@RequiredArgsConstructor
public class OrganizerController {

    private final OrganizerService organizerService;


    @GetMapping("/{id}")
    public Organizer getById(@PathVariable Long id) {
        return organizerService.getById(id);
    }

    @PostMapping
    public Organizer create(@RequestBody Organizer organizer) {
        return organizerService.create(organizer);
    }

    @PutMapping("/{id}")
    public Organizer update(@PathVariable Long id, @RequestBody Organizer organizer) {
        return organizerService.update(id, organizer);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        organizerService.delete(id);
    }
}
