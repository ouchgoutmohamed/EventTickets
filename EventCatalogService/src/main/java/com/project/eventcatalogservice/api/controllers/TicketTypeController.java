package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.domains.entities.TicketType;
import com.project.eventcatalogservice.services.TicketTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ticket-types")
@RequiredArgsConstructor
public class TicketTypeController {

    private final TicketTypeService ticketTypeService;


    @GetMapping
    public List<TicketType> getAll() {
        return ticketTypeService.getAll();
    }

    @GetMapping("/{id}")
    public TicketType getById(@PathVariable Long id) {
        return ticketTypeService.getById(id);
    }

    @PostMapping
    public TicketType create(@RequestBody TicketType ticketType) {
        return ticketTypeService.create(ticketType);
    }

    @PutMapping("/{id}")
    public TicketType update(@PathVariable Long id, @RequestBody TicketType ticketType) {
        return ticketTypeService.update(id, ticketType);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        ticketTypeService.delete(id);
    }
}
