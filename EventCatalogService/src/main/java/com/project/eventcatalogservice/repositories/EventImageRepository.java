package com.project.eventcatalogservice.repositories;

import com.project.eventcatalogservice.domains.entities.Event;
import com.project.eventcatalogservice.domains.entities.EventImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EventImageRepository extends JpaRepository<EventImage, Long> {
    @Query("select e from EventImage e where e.deleted=false ")
    List<EventImage> findAllNotDeleted();
}
