package com.acme.tickets.dto;

/**
 * Deprecated: manual inventory creation removed. Kept for backward compatibility (unused).
 */
@Deprecated
public record CreateInventoryResponse(Long eventId, Integer total, Integer available, String message) {}
