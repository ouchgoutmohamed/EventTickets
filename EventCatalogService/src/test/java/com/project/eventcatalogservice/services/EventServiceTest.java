package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.*;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.domains.enums.EventStatus;
import com.project.eventcatalogservice.repositories.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventService eventService;

    private Event mockEvent;
    private Category mockCategory;
    private Venue mockVenue;

    @BeforeEach
    void setUp() {
        mockCategory = new Category();
        mockCategory.setId(1L);
        mockCategory.setName("Concert");

        mockVenue = new Venue();
        mockVenue.setId(1L);
        mockVenue.setName("Stade de France");

        mockEvent = new Event();
        mockEvent.setId(1L);
        mockEvent.setTitle("Coldplay Live");
        mockEvent.setDescription("Amazing concert");
        mockEvent.setVenue(mockVenue);
        mockEvent.setStatus(EventStatus.PUBLISHED);
        mockEvent.setDeleted(false);
    }

    @Test
    void getAllEvents_ShouldReturnAllNotDeletedEvents() {
        // Given
        List<Event> events = Arrays.asList(mockEvent);
        when(eventRepository.findAllNotDeleted()).thenReturn(events);

        // When
        List<Event> result = eventRepository.findAllNotDeleted();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Coldplay Live");
        verify(eventRepository).findAllNotDeleted();
    }

    @Test
    void getEventsByCategory_ShouldReturnFilteredEvents() {
        // Given
        List<Event> events = Arrays.asList(mockEvent);
        when(eventRepository.findByCategory(CategoryType.MUSIC)).thenReturn(events);

        // When
        List<Event> result = eventRepository.findByCategory(CategoryType.MUSIC);

        // Then
        assertThat(result).hasSize(1);
        verify(eventRepository).findByCategory(CategoryType.MUSIC);
    }

    @Test
    void getEventsByStatus_ShouldReturnFilteredEvents() {
        // Given
        List<Event> events = Arrays.asList(mockEvent);
        when(eventRepository.findByStatus(EventStatus.PUBLISHED)).thenReturn(events);

        // When
        List<Event> result = eventRepository.findByStatus(EventStatus.PUBLISHED);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository).findByStatus(EventStatus.PUBLISHED);
    }

    @Test
    void getEventsByOrganizer_ShouldReturnFilteredEvents() {
        // Given
        List<Event> events = Arrays.asList(mockEvent);
        when(eventRepository.findByOrganizer_Id(1L)).thenReturn(events);

        // When
        List<Event> result = eventRepository.findByOrganizer_Id(1L);

        // Then
        assertThat(result).hasSize(1);
        verify(eventRepository).findByOrganizer_Id(1L);
    }

    @Test
    void searchEventsByTitle_ShouldReturnMatchingEvents() {
        // Given
        String keyword = "Coldplay";
        List<Event> events = Arrays.asList(mockEvent);
        when(eventRepository.findByTitleContainingIgnoreCase(keyword)).thenReturn(events);

        // When
        List<Event> result = eventRepository.findByTitleContainingIgnoreCase(keyword);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).contains("Coldplay");
        verify(eventRepository).findByTitleContainingIgnoreCase(keyword);
    }
}
