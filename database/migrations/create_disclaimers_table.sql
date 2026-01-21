-- Disclaimers Table
-- Procedures Involving Risk of Damage disclaimer forms

CREATE TABLE IF NOT EXISTS disclaimers (
  id SERIAL PRIMARY KEY,
  disclaimer_number VARCHAR(30) UNIQUE NOT NULL,  -- DS-YYYYMMDD-XXX
  procedure_description TEXT NOT NULL,

  -- Optional additional disclaimers
  include_existing_parts_disclaimer BOOLEAN DEFAULT false,
  include_diagnostic_payment_disclaimer BOOLEAN DEFAULT false,

  -- Customer signature data
  customer_email VARCHAR(255),
  customer_signature TEXT,           -- Base64 PNG
  signature_date TIMESTAMP,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'signed')),

  -- Share link
  share_token VARCHAR(255) UNIQUE,

  -- Metadata
  created_by VARCHAR(100) DEFAULT 'Staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP
);

-- Index for fast share link lookups
CREATE INDEX IF NOT EXISTS idx_disclaimers_share_token ON disclaimers(share_token);

-- Index for listing by status
CREATE INDEX IF NOT EXISTS idx_disclaimers_status ON disclaimers(status);

-- Index for listing by date
CREATE INDEX IF NOT EXISTS idx_disclaimers_created_at ON disclaimers(created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_disclaimers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS disclaimers_updated_at_trigger ON disclaimers;
CREATE TRIGGER disclaimers_updated_at_trigger
  BEFORE UPDATE ON disclaimers
  FOR EACH ROW
  EXECUTE FUNCTION update_disclaimers_updated_at();
