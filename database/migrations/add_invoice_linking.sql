-- Migration: Add invoice linking to expenses, mileage, and receipts
-- Purpose: Enable job costing by linking costs to specific invoices

-- Add invoice_id to business_expenses
ALTER TABLE business_expenses
ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

-- Add invoice_id to business_mileage
ALTER TABLE business_mileage
ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

-- Add invoice_id to receipts
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_expenses_invoice_id ON business_expenses(invoice_id);
CREATE INDEX IF NOT EXISTS idx_business_mileage_invoice_id ON business_mileage(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);

-- Create a view for job profit calculation
CREATE OR REPLACE VIEW job_costs AS
SELECT
  i.id as invoice_id,
  i.invoice_number,
  i.client_name,
  i.vehicle_reg,
  i.total as invoice_total,
  i.vat_amount as invoice_vat,
  (i.total - i.vat_amount) as invoice_net,
  COALESCE(e.total_expenses, 0) as total_expenses,
  COALESCE(m.total_mileage, 0) as total_mileage,
  COALESCE(r.total_receipts, 0) as total_receipts,
  (COALESCE(e.total_expenses, 0) + COALESCE(m.total_mileage, 0) + COALESCE(r.total_receipts, 0)) as total_costs,
  ((i.total - i.vat_amount) - COALESCE(e.total_expenses, 0) - COALESCE(m.total_mileage, 0) - COALESCE(r.total_receipts, 0)) as profit
FROM invoices i
LEFT JOIN (
  SELECT invoice_id, SUM(amount) as total_expenses
  FROM business_expenses
  WHERE invoice_id IS NOT NULL
  GROUP BY invoice_id
) e ON i.id = e.invoice_id
LEFT JOIN (
  SELECT invoice_id, SUM(claim_amount) as total_mileage
  FROM business_mileage
  WHERE invoice_id IS NOT NULL
  GROUP BY invoice_id
) m ON i.id = m.invoice_id
LEFT JOIN (
  SELECT invoice_id, SUM(amount) as total_receipts
  FROM receipts
  WHERE invoice_id IS NOT NULL
  GROUP BY invoice_id
) r ON i.id = r.invoice_id;
