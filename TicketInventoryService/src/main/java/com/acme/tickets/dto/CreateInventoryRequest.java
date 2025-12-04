package com.acme.tickets.dto;

/**
 * Deprecated: manual inventory creation removed. Kept for backward compatibility (unused).
 */
@Deprecated
public record CreateInventoryRequest(Long eventId, Integer total) {}
