-- Add estimate_number and invoice_number columns to tables

-- Add estimate_number to estimates table
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS estimate_number VARCHAR(50);

-- Add invoice_number, invoice_date, and due_date to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add estimate_date to estimates table
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS estimate_date DATE DEFAULT CURRENT_DATE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimates_estimate_number ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
