-- Add job completion tracking fields to invoices table
-- Run this migration to enable profit tracking per job

-- Add job completion timestamp
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS job_completed_at TIMESTAMPTZ;

-- Add cost tracking columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mileage_cost DECIMAL(10,2) DEFAULT 0;

-- Add profit tracking columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2);

-- Create index for filtering completed jobs
CREATE INDEX IF NOT EXISTS idx_invoices_job_completed ON invoices(job_completed_at) WHERE job_completed_at IS NOT NULL;
