# EventCatalogService API Testing Guide

This document provides guidance on how to test the various APIs in the EventCatalogService using the JSON examples provided in the `api-test-examples.json` file.

## Overview

The `api-test-examples.json` file contains JSON examples for testing all the different APIs in the EventCatalogService. The examples are organized by controller and include examples for all endpoints that require a request body.

## How to Use the JSON Examples

### Using Postman

1. Import the `api-test-examples.json` file into Postman as a collection
2. For each endpoint, create a new request with the appropriate HTTP method and URL
3. For endpoints that require a request body, copy the JSON from the `requestBody` field in the example
4. For endpoints that require path variables, replace the placeholders in the URL with actual values
5. For endpoints that require query parameters, add them to the URL as shown in the example

### Using cURL

For endpoints that require a request body, you can use cURL commands like:

```bash
curl -X POST http://localhost:8080/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Music Festival 2023",
    "description": "A three-day music festival featuring top artists from around the world",
    "date": "2023-07-15",
    "startTime": "2023-07-15T14:00:00",
    "endTime": "2023-07-17T23:00:00",
    "status": "DRAFT",
    "category": "MUSIC",
    "venueId": 1,
    "artistIds": [1, 2, 3],
    "ticketTypes": [
      {
        "name": "General Admission",
        "price": 150.00,
        "quantity": 5000
      },
      {
        "name": "VIP",
        "price": 300.00,
        "quantity": 500
      }
    ],
    "images": [
      {
        "url": "https://example.com/images/summer-fest-1.jpg"
      },
      {
        "url": "https://example.com/images/summer-fest-2.jpg"
      }
    ]
  }'
```

## Testing Workflow

### Prerequisites

1. Ensure the EventCatalogService is running
2. Make sure you have the necessary authentication tokens if required

### Recommended Testing Order

1. Create entities in this order:
   - Organizers
   - Venues
   - Artists
   - Events (which will include ticket types and images)

2. Test read operations:
   - Get all entities
   - Get entities by ID
   - Filter and search operations

3. Test update operations:
   - Update entities
   - Update event status

4. Test delete operations

## Authentication

Some endpoints may require authentication. If you're using the JWT authentication implemented in the service, you'll need to:

1. Obtain a JWT token by authenticating with the user service
2. Include the token in the Authorization header of your requests:
   ```
   Authorization: Bearer your_jwt_token_here
   ```

## Example Testing Scenarios

### Scenario 1: Create and Manage an Event

1. Create an organizer
2. Create a venue
3. Create artists
4. Create an event (with ticket types and images)
5. Update the event
6. Change the event status from DRAFT to PUBLISHED
7. Get the event details
8. Delete the event

### Scenario 2: Search and Filter Events

1. Create multiple events with different categories, dates, and statuses
2. Test the search endpoint with different keywords
3. Test filtering by category
4. Test filtering by status
5. Test filtering by date range
6. Test filtering by organizer

## Troubleshooting

If you encounter errors:

1. Check that your request body matches the expected format
2. Ensure all required fields are included
3. Verify that referenced entities (by ID) exist in the database
4. Check authentication headers if applicable
5. Review server logs for detailed error messages