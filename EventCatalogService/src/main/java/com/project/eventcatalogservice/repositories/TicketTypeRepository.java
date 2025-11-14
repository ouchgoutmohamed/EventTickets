package com.project.eventcatalogservice.repositories;

import com.project.eventcatalogservice.domains.entities.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {
    @Query("select t from TicketType t where t.deleted = false")
    List<TicketType> findAllNotDeleted();
}
