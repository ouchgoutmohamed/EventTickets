-- ============================================================
-- JMeter Load Test - Database Seeding Script
-- Run this BEFORE the load test to ensure sufficient inventory
-- ============================================================

-- Reset and seed inventory for events 1-5
-- Each event gets 1000 tickets (5000 total across all events)

-- First, release all PENDING reservations to free up inventory
UPDATE reservation 
SET status = 'EXPIRED' 
WHERE status = 'PENDING';

-- Reset inventory for test events (create or update)
INSERT INTO inventory (event_id, total, reserved, version)
VALUES 
    (1, 1000, 0, 0),
    (2, 1000, 0, 0),
    (3, 1000, 0, 0),
    (4, 1000, 0, 0),
    (5, 1000, 0, 0)
ON DUPLICATE KEY UPDATE 
    total = 1000,
    reserved = 0,
    version = version + 1;

-- Verify the inventory
SELECT event_id, total, reserved, (total - reserved) as available 
FROM inventory 
WHERE event_id BETWEEN 1 AND 5;

-- Summary
SELECT 
    COUNT(*) as event_count,
    SUM(total) as total_tickets,
    SUM(reserved) as reserved_tickets,
    SUM(total - reserved) as available_tickets
FROM inventory 
WHERE event_id BETWEEN 1 AND 5;
