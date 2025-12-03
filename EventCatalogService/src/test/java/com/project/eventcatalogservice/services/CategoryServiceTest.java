package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.Category;
import com.project.eventcatalogservice.repositories.CategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category mockCategory;

    @BeforeEach
    void setUp() {
        mockCategory = new Category();
        mockCategory.setId(1L);
        mockCategory.setName("Concert");
        mockCategory.setDescription("Live music events");
        mockCategory.setDeleted(false);
    }

    @Test
    void getAllCategories_ShouldReturnAllCategories() {
        // Given
        List<Category> categories = Arrays.asList(mockCategory);
        when(categoryRepository.getAllNotDeleted()).thenReturn(categories);

        // When
        List<Category> result = categoryService.getAll();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Concert");
        verify(categoryRepository).getAllNotDeleted();
    }

    @Test
    void getCategoryById_WhenCategoryExists_ShouldReturnCategory() {
        // Given
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));

        // When
        Category result = categoryService.getById(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Concert");
        verify(categoryRepository).findById(1L);
    }

    @Test
    void getCategoryById_WhenCategoryDoesNotExist_ShouldThrowException() {
        // Given
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> categoryService.getById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void createCategory_ShouldSaveAndReturnCategory() {
        // Given
        Category newCategory = new Category();
        newCategory.setName("Sport");
        newCategory.setDescription("Sports events");
        
        Category savedCategory = new Category();
        savedCategory.setId(2L);
        savedCategory.setName("Sport");
        savedCategory.setDescription("Sports events");
        savedCategory.setDeleted(false);

        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        // When
        Category result = categoryService.create(newCategory);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Sport");
        assertThat(result.isDeleted()).isFalse();
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void deleteCategory_WhenCategoryExists_ShouldMarkAsDeleted() {
        // Given
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(mockCategory);

        // When
        categoryService.delete(1L);

        // Then
        verify(categoryRepository).findById(1L);
        verify(categoryRepository).save(argThat(category -> category.isDeleted()));
    }

    @Test
    void updateCategory_ShouldUpdateAndReturnCategory() {
        // Given
        Category updatedDetails = new Category();
        updatedDetails.setName("Updated Concert");
        updatedDetails.setDescription("Updated description");
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(mockCategory);

        // When
        Category result = categoryService.update(1L, updatedDetails);

        // Then
        assertThat(result).isNotNull();
        verify(categoryRepository).findById(1L);
        verify(categoryRepository).save(mockCategory);
    }
}
