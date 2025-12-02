package com.acme.tickets.exception;

public class CategoryLimitExceededException extends RuntimeException {
    private final String category;
    private final int requested;
    private final int maxAllowed;

    public CategoryLimitExceededException(String category, int requested, int maxAllowed) {
        super(String.format("La catégorie %s limite à %d billets par réservation (demandé: %d)",
                category, maxAllowed, requested));
        this.category = category;
        this.requested = requested;
        this.maxAllowed = maxAllowed;
    }

    public String getCategory() { return category; }
    public int getRequested() { return requested; }
    public int getMaxAllowed() { return maxAllowed; }
}
