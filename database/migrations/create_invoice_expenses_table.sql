-- Invoice Expenses Table
-- Stores OCR-extracted expense data linked to invoices
-- Created: 2026-01-10

CREATE TABLE IF NOT EXISTS invoice_expenses (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Extracted OCR Data
  expense_date DATE,
  supplier VARCHAR(255),
  reference_number VARCHAR(100),  -- Supplier invoice/receipt number
  description TEXT,

  -- Amount Breakdown
  parts_amount DECIMAL(10,2) DEFAULT 0,
  labour_amount DECIMAL(10,2) DEFAULT 0,
  services_amount DECIMAL(10,2) DEFAULT 0,
  other_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,

  -- Category
  category VARCHAR(50) DEFAULT 'general',  -- parts, labour, services, mixed, general

  -- OCR Metadata
  raw_ocr_text TEXT,              -- Original OCR output for reference
  confidence_score DECIMAL(3,2),  -- AI confidence 0.00 to 1.00

  -- Timestamps
  created_by VARCHAR(100) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by invoice
CREATE INDEX idx_invoice_expenses_invoice_id ON invoice_expenses(invoice_id);

-- Index for date-based queries
CREATE INDEX idx_invoice_expenses_date ON invoice_expenses(expense_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_invoice_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_expenses_updated_at
  BEFORE UPDATE ON invoice_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_expenses_updated_at();

-- Comment
COMMENT ON TABLE invoice_expenses IS 'Stores OCR-extracted expense data linked to customer invoices for cost tracking';
