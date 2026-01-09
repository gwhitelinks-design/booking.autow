-- Create receipts table for storing receipt metadata
-- Images are stored in Google Drive, this table stores references and metadata

CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,     -- REC-YYYYMMDD-XXX auto-generated
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Receipt Details
    supplier VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),                           -- fuel, parts, tools, supplies, misc

    -- Google Drive Reference
    gdrive_file_id VARCHAR(255),                     -- Google Drive file ID
    gdrive_file_url VARCHAR(500),                    -- Direct link to file in Drive
    gdrive_folder_path VARCHAR(255),                 -- Monthly folder path e.g., '2026-01'
    original_filename VARCHAR(255),                  -- Original uploaded filename

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',   -- pending, processed, archived

    -- Metadata
    created_by VARCHAR(255) NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_supplier ON receipts(supplier);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_folder_path ON receipts(gdrive_folder_path);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS receipts_updated_at_trigger ON receipts;
CREATE TRIGGER receipts_updated_at_trigger
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_receipts_updated_at();

-- Function to generate receipt number (REC-YYYYMMDD-XXX)
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    today_str VARCHAR(8);
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(receipt_number FROM 14 FOR 3) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM receipts
    WHERE receipt_number LIKE 'REC-' || today_str || '-%';

    new_number := 'REC-' || today_str || '-' || LPAD(seq_num::TEXT, 3, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;
