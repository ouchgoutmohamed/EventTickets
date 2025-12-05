-- Initialization script for MySQL databases
-- This script runs automatically when the MySQL container starts for the first time

-- Create database for User Service
CREATE DATABASE IF NOT EXISTS eventtickets_users;

-- Create database for Event Catalog Service  
CREATE DATABASE IF NOT EXISTS eventtickets_events;

-- Create database for Ticket Inventory Service
CREATE DATABASE IF NOT EXISTS ticket_inventory;

-- Create database for Payment and Notification Service
CREATE DATABASE IF NOT EXISTS eventtickets_payments;

-- Grant all privileges to root user on all databases
GRANT ALL PRIVILEGES ON eventtickets_users.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON eventtickets_events.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON ticket_inventory.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON eventtickets_payments.* TO 'root'@'%';

FLUSH PRIVILEGES;
