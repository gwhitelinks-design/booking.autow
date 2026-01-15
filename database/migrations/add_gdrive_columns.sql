-- Add Google Drive folder columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS gdrive_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gdrive_folder_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS gdrive_pdf_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gdrive_pdf_url VARCHAR(500);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_invoices_gdrive_folder ON invoices(gdrive_folder_id);

-- Add Google Drive folder ID column to receipts table (replacing folder_path approach)
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS gdrive_folder_id VARCHAR(255);

-- Index for receipts folder lookup
CREATE INDEX IF NOT EXISTS idx_receipts_gdrive_folder ON receipts(gdrive_folder_id);
