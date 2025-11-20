package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.Artist;
import com.project.eventcatalogservice.repositories.ArtistRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtistService {

    private final ArtistRepository artistRepository;


    public List<Artist> getAll() {
        // Retourne seulement les artistes non supprimés
        return artistRepository.findAllNotDeleted();
    }

    public Artist getById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Artist not found"));
        if (artist.isDeleted()) {
            throw new EntityNotFoundException("Artist has been deleted");
        }
        return artist;
    }

    public Artist create(Artist artist) {
        artist.setDeleted(false);
        return artistRepository.save(artist);
    }

    public Artist update(Long id, Artist artistDetails) {
        Artist artist = getById(id);
        artist.setName(artistDetails.getName());
        artist.setGenre(artistDetails.getGenre());
        artist.setCountry(artistDetails.getCountry());
        return artistRepository.save(artist);
    }

    public void delete(Long id) {
        Artist artist = getById(id);
        artist.setDeleted(true);
        artistRepository.save(artist);
    }
}
