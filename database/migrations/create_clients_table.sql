-- Create clients table for centralized client management
-- Migration: create_clients_table.sql
-- Date: 2026-01-24

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    vehicle_reg VARCHAR(20),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(255) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_vehicle_reg ON clients(vehicle_reg);

-- Use existing trigger function (update_updated_at_column) to auto-update updated_at
-- Note: This function should already exist from other tables (invoices, estimates, etc.)
-- If running on fresh DB, ensure function exists first

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_clients_updated_at
            BEFORE UPDATE ON clients
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Trigger already exists, ignore
END $$;

-- Data aggregation: Import unique clients from existing records
-- Run this AFTER creating the table to populate initial data

INSERT INTO clients (name, email, address, phone, mobile, vehicle_reg, vehicle_make, vehicle_model, created_by)
SELECT DISTINCT ON (LOWER(TRIM(name)))
    name, email, address, phone, mobile, vehicle_reg, vehicle_make, vehicle_model, 'Migration'
FROM (
    SELECT
        client_name as name,
        client_email as email,
        client_address as address,
        client_phone as phone,
        client_mobile as mobile,
        vehicle_reg,
        vehicle_make,
        vehicle_model,
        created_at
    FROM invoices
    WHERE client_name IS NOT NULL AND client_name != ''

    UNION ALL

    SELECT
        client_name,
        client_email,
        client_address,
        client_phone,
        client_mobile,
        vehicle_reg,
        vehicle_make,
        vehicle_model,
        created_at
    FROM estimates
    WHERE client_name IS NOT NULL AND client_name != ''

    UNION ALL

    SELECT
        customer_name,
        customer_email,
        customer_address,
        customer_phone,
        NULL as mobile,
        vehicle_reg,
        NULL as vehicle_make,
        vehicle_type_model as vehicle_model,
        created_at
    FROM vehicle_reports
    WHERE customer_name IS NOT NULL AND customer_name != ''

    UNION ALL

    SELECT
        customer_name,
        customer_email,
        location_address,
        customer_phone,
        NULL as mobile,
        vehicle_reg,
        vehicle_make,
        vehicle_model,
        created_at
    FROM bookings
    WHERE customer_name IS NOT NULL AND customer_name != ''
) AS all_clients
WHERE name IS NOT NULL AND name != ''
ORDER BY LOWER(TRIM(name)), created_at DESC
ON CONFLICT DO NOTHING;
