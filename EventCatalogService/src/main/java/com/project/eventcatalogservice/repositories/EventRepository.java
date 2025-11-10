package com.project.eventcatalogservice.repositories;

import com.project.eventcatalogservice.domains.entities.Event;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event,Long> {
    List<Event> findByCategory(CategoryType category);
    List<Event> findByStatus(EventStatus status);
    List<Event> findByOrganizer_Id(Long organizerId);
    List<Event> findByDateBetween(Date start, Date end);
    List<Event> findByTitleContainingIgnoreCase(String keyword);
    @Query("select e from Event e where e.deleted=false ")
    List<Event> findAllNotDeleted();


}
