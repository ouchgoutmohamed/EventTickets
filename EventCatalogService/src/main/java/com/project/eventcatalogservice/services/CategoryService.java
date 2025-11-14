package com.project.eventcatalogservice.services;

import com.project.eventcatalogservice.domains.entities.Category;
import com.project.eventcatalogservice.repositories.CategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;


    public List<Category> getAll() {
        return categoryRepository.getAllNotDeleted();
    }

    public Category getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        if (category.isDeleted()) throw new EntityNotFoundException("Category deleted");
        return category;
    }

    public Category create(Category category) {
        category.setDeleted(false);
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category details) {
        Category category = getById(id);
        category.setName(details.getName());
        category.setDescription(details.getDescription());
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        Category category = getById(id);
        category.setDeleted(true);
        categoryRepository.save(category);
    }
}
