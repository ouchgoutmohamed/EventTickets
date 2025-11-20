package com.project.eventcatalogservice.repositories;

import com.project.eventcatalogservice.domains.entities.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    @Query("select a from Artist a where a.deleted=false ")
    List<Artist> findAllNotDeleted();
}
