package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.TicketType;
import com.project.eventcatalogservice.repositories.TicketTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketTypeService {

    private final TicketTypeRepository ticketTypeRepository;

    public List<TicketType> getAll() {
        return ticketTypeRepository.findAllNotDeleted();
    }

    public TicketType getById(Long id) {
        TicketType ticketType = ticketTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket type not found"));
        if (ticketType.isDeleted()) throw new EntityNotFoundException("Ticket type deleted");
        return ticketType;
    }

    public TicketType create(TicketType ticketType) {
        ticketType.setDeleted(false);
        return ticketTypeRepository.save(ticketType);
    }

    public TicketType update(Long id, TicketType details) {
        TicketType ticketType = getById(id);
        ticketType.setTicketName(details.getTicketName());
        ticketType.setPrice(details.getPrice());
        ticketType.setQuantity(details.getQuantity());
        return ticketTypeRepository.save(ticketType);
    }

    public void delete(Long id) {
        TicketType ticketType = getById(id);
        ticketType.setDeleted(true);
        ticketTypeRepository.save(ticketType);
    }
}
