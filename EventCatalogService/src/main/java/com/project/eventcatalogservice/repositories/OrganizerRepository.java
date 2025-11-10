package com.project.eventcatalogservice.repositories;

import com.project.eventcatalogservice.domains.entities.Event;
import com.project.eventcatalogservice.domains.entities.Organizer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizerRepository extends JpaRepository<Organizer,Long> {
    @Query("select o from Organizer o where o.deleted=false ")
    List<Organizer> findAllNotDeleted();
}
