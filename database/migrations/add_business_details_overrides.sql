-- Migration: Add business details override fields to invoices and estimates
-- Date: 2026-02-02
-- Purpose: Allow per-document customization of business details (like notes)

-- Add business detail overrides to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_phone VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_website VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_workshop_location VARCHAR(255);

-- Add business detail overrides to estimates table
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS business_phone VARCHAR(50);
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS business_website VARCHAR(255);
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS business_workshop_location VARCHAR(255);

-- Note: When these fields are NULL, the share pages will fall back to business_settings table defaults
