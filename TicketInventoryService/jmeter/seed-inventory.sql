-- ============================================
-- Seed Ticket Inventory for Load Testing
-- ============================================
-- This script creates/updates inventory for events 1-5
-- with 1000 tickets each, and clears old reservations

-- Clear expired/pending reservations to free up tickets
UPDATE reservation SET status = 'EXPIRED' WHERE status = 'PENDING';

-- Delete old test reservations (optional - uncomment if needed)
-- DELETE FROM reservation WHERE user_id > 1000;

-- Create or update inventory for events 1-5 with 1000 tickets each
INSERT INTO inventory (event_id, total_tickets, reserved_tickets)
VALUES 
    (1, 1000, 0),
    (2, 1000, 0),
    (3, 1000, 0),
    (4, 1000, 0),
    (5, 1000, 0)
ON DUPLICATE KEY UPDATE 
    total_tickets = 1000,
    reserved_tickets = 0;

-- Verify inventory
SELECT * FROM inventory WHERE event_id BETWEEN 1 AND 5;

-- Show reservation counts per status
SELECT status, COUNT(*) as count FROM reservation GROUP BY status;
