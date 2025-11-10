package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.services.VenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.project.eventcatalogservice.domains.entities.Venue;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @GetMapping
    public List<Venue> getAll() {
        return venueService.getAll();
    }

    @GetMapping("/{id}")
    public Venue getById(@PathVariable Long id) {
        return venueService.getById(id);
    }

    @PostMapping
    public Venue create(@RequestBody Venue venue) {
        return venueService.create(venue);
    }

    @PutMapping("/{id}")
    public Venue update(@PathVariable Long id, @RequestBody Venue venue) {
        return venueService.update(id, venue);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        venueService.delete(id);
    }
}