package com.project.eventcatalogservice.api.controllers;

import com.project.eventcatalogservice.domains.entities.Category;
import com.project.eventcatalogservice.domains.enums.CategoryType;
import com.project.eventcatalogservice.services.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @GetMapping
    public List<CategoryType> getAllCategories() {
        return List.of(CategoryType.values());
    }

    /*@GetMapping
    public List<Category> getAll() { return service.getAll(); }

    @GetMapping("/{id}")
    public Category getById(@PathVariable Long id) { return service.getById(id); }

    @PostMapping("")
    public Category create(@RequestBody Category c) { return service.create(c); }

    @PutMapping("/{id}")
    public Category update(@PathVariable Long id, @RequestBody Category c) { return service.update(id, c); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { service.delete(id); }*/
}

