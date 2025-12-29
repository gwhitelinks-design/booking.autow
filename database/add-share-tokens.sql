-- Add share token and view tracking fields to estimates and invoices

-- Add columns to estimates table
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS share_token_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Add columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS share_token_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create function to generate random token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(64) AS $$
DECLARE
    characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    token TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..64 LOOP
        token := token || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Create view tracking table
CREATE TABLE IF NOT EXISTS document_views (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL, -- 'estimate' or 'invoice'
    document_id INTEGER NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_document_views_document ON document_views(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_document_views_viewed_at ON document_views(viewed_at);
