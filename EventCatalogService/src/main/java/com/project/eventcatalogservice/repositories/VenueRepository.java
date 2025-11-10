package com.project.eventcatalogservice.repositories;

import com.project.eventcatalogservice.domains.entities.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {
    @Query("select v from Venue v where v.deleted=false")
    List<Venue> findAllNotDeleted();
}
