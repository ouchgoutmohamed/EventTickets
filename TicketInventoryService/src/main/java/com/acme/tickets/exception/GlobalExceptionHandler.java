package com.acme.tickets.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire global des exceptions pour l'API.
 * Capture les erreurs et retourne des réponses JSON standardisées.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String TIMESTAMP_KEY = "timestamp";
    private static final String STATUS_KEY = "status";
    private static final String ERROR_KEY = "error";
    private static final String MESSAGE_KEY = "message";

    /**
     * Gère les erreurs de validation Jakarta (@Valid).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        logger.warn("Validation failed for request {}: {}", request.getDescription(false), fieldErrors);
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Validation Failed",
                "Les données de la requête sont invalides",
                Map.of("errors", fieldErrors)
            ));
    }

    /**
     * Gère les réservations non trouvées (404).
     */
    @ExceptionHandler(ReservationNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleReservationNotFound(
            ReservationNotFoundException ex, WebRequest request) {
        
        logger.warn("Reservation not found: {}", ex.getMessage());
        
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(buildErrorResponse(
                HttpStatus.NOT_FOUND,
                "Reservation Not Found",
                ex.getMessage(),
                Map.of("reservationId", ex.getReservationId())
            ));
    }

    /**
     * Gère les inventaires non trouvés (404).
     */
    @ExceptionHandler(InventoryNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleInventoryNotFound(
            InventoryNotFoundException ex, WebRequest request) {
        
        logger.warn("Inventory not found: {}", ex.getMessage());
        
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(buildErrorResponse(
                HttpStatus.NOT_FOUND,
                "Inventory Not Found",
                ex.getMessage(),
                Map.of("eventId", ex.getEventId())
            ));
    }

    /**
     * Gère le stock insuffisant (409 Conflict).
     */
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientStock(
            InsufficientStockException ex, WebRequest request) {
        
        logger.warn("Insufficient stock: {}", ex.getMessage());
        
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(buildErrorResponse(
                HttpStatus.CONFLICT,
                "Insufficient Stock",
                ex.getMessage(),
                Map.of(
                    "eventId", ex.getEventId(),
                    "requested", ex.getRequested(),
                    "available", ex.getAvailable()
                )
            ));
    }

    /**
     * Gère les dépassements de limite par catégorie (400 Bad Request).
     */
    @ExceptionHandler(CategoryLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleCategoryLimitExceeded(
            CategoryLimitExceededException ex, WebRequest request) {

        logger.warn("Category limit exceeded: {}", ex.getMessage());

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Category Limit Exceeded",
                ex.getMessage(),
                Map.of(
                    "category", ex.getCategory(),
                    "requested", ex.getRequested(),
                    "maxAllowed", ex.getMaxAllowed()
                )
            ));
    }

    /**
     * Gère les réservations expirées (422 Unprocessable Entity).
     */
    @ExceptionHandler(ReservationExpiredException.class)
    public ResponseEntity<Map<String, Object>> handleReservationExpired(
            ReservationExpiredException ex, WebRequest request) {
        
        logger.warn("Reservation expired: {}", ex.getMessage());
        
        return ResponseEntity
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Reservation Expired",
                ex.getMessage(),
                Map.of("reservationId", ex.getReservationId())
            ));
    }

    /**
     * Gère les états de réservation invalides (422).
     */
    @ExceptionHandler(InvalidReservationStateException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidReservationState(
            InvalidReservationStateException ex, WebRequest request) {
        
        logger.warn("Invalid reservation state: {}", ex.getMessage());
        
        return ResponseEntity
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Invalid Reservation State",
                ex.getMessage(),
                Map.of(
                    "reservationId", ex.getReservationId(),
                    "currentStatus", ex.getCurrentStatus(),
                    "expectedStatus", ex.getExpectedStatus()
                )
            ));
    }

    /**
     * Gère toutes les exceptions non capturées (500).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, WebRequest request) {
        
        logger.error("Unexpected error occurred: {}", ex.getMessage(), ex);
        
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
                null
            ));
    }

    /**
     * Construit une réponse d'erreur standardisée.
     */
    private Map<String, Object> buildErrorResponse(
            HttpStatus status, 
            String error, 
            String message, 
            Map<String, Object> details) {
        
        Map<String, Object> response = new HashMap<>();
        response.put(TIMESTAMP_KEY, Instant.now().toString());
        response.put(STATUS_KEY, status.value());
        response.put(ERROR_KEY, error);
        response.put(MESSAGE_KEY, message);
        
        if (details != null && !details.isEmpty()) {
            response.putAll(details);
        }
        
        return response;
    }
}
