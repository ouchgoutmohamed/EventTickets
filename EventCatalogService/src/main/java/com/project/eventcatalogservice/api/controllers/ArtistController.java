package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.domains.entities.Artist;
import com.project.eventcatalogservice.services.ArtistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/artists")
@RequiredArgsConstructor
public class ArtistController {

    private final ArtistService artistService;


    @GetMapping
    public List<Artist> getAll() {
        return artistService.getAll();
    }

    @GetMapping("/{id}")
    public Artist getById(@PathVariable Long id) {
        return artistService.getById(id);
    }

    @PostMapping
    public Artist create(@RequestBody Artist artist) {
        return artistService.create(artist);
    }

    @PutMapping("/{id}")
    public Artist update(@PathVariable Long id, @RequestBody Artist artist) {
        return artistService.update(id, artist);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        artistService.delete(id);
    }
}