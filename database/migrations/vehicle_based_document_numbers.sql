-- Vehicle-Based Document Numbering System
-- Format: <VEHICLE_REG>-<SEQUENCE> e.g., HN14UWY-001, HN14UWY-002
-- Each vehicle gets its own sequence counter

-- ============================================
-- DROP OLD FUNCTIONS FIRST
-- ============================================

DROP FUNCTION IF EXISTS generate_invoice_number();
DROP FUNCTION IF EXISTS generate_estimate_number();

-- ============================================
-- ADD SEQUENCE NUMBER COLUMNS
-- ============================================

-- Add sequence_number to invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- Add sequence_number to estimates
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- ============================================
-- CREATE INDEXES FOR VEHICLE-BASED QUERIES
-- ============================================

-- Index for invoice lookups by vehicle_reg
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_reg ON invoices(vehicle_reg);

-- Index for estimate lookups by vehicle_reg
CREATE INDEX IF NOT EXISTS idx_estimates_vehicle_reg ON estimates(vehicle_reg);

-- Composite index for sequence lookups
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_sequence ON invoices(vehicle_reg, sequence_number);
CREATE INDEX IF NOT EXISTS idx_estimates_vehicle_sequence ON estimates(vehicle_reg, sequence_number);

-- ============================================
-- UNIQUE CONSTRAINTS (Concurrency Safety)
-- ============================================

-- Ensure no duplicate sequences per vehicle for invoices
-- Note: Using partial unique index to handle NULL vehicle_reg
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_vehicle_seq_unique
ON invoices(vehicle_reg, sequence_number)
WHERE vehicle_reg IS NOT NULL;

-- Ensure no duplicate sequences per vehicle for estimates
CREATE UNIQUE INDEX IF NOT EXISTS idx_estimates_vehicle_seq_unique
ON estimates(vehicle_reg, sequence_number)
WHERE vehicle_reg IS NOT NULL;

-- ============================================
-- HELPER FUNCTION: NORMALIZE VEHICLE REG
-- ============================================

CREATE OR REPLACE FUNCTION normalize_vehicle_reg(reg VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF reg IS NULL OR reg = '' THEN
        RETURN NULL;
    END IF;
    -- Remove spaces and convert to uppercase
    RETURN UPPER(REPLACE(REPLACE(reg, ' ', ''), '-', ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- UPDATED: GENERATE INVOICE NUMBER (Per-Vehicle)
-- ============================================

CREATE OR REPLACE FUNCTION generate_invoice_number(vehicle_reg_input VARCHAR DEFAULT NULL)
RETURNS TABLE(invoice_number VARCHAR(50), sequence_num INTEGER, normalized_reg VARCHAR(20)) AS $$
DECLARE
    norm_reg VARCHAR(20);
    next_seq INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Normalize the vehicle registration
    norm_reg := normalize_vehicle_reg(vehicle_reg_input);

    IF norm_reg IS NULL OR norm_reg = '' THEN
        -- Fallback for no vehicle: use global INV-XXXXX format
        SELECT COALESCE(MAX(i.sequence_number), 0) + 1 INTO next_seq
        FROM invoices i
        WHERE i.vehicle_reg IS NULL OR i.vehicle_reg = '';

        new_number := 'INV-' || LPAD(next_seq::TEXT, 5, '0');
        normalized_reg := NULL;
    ELSE
        -- Get the highest sequence number for this vehicle
        SELECT COALESCE(MAX(i.sequence_number), 0) + 1 INTO next_seq
        FROM invoices i
        WHERE normalize_vehicle_reg(i.vehicle_reg) = norm_reg;

        -- Format as VEHICLE_REG-001, VEHICLE_REG-002, etc.
        new_number := norm_reg || '-' || LPAD(next_seq::TEXT, 3, '0');
        normalized_reg := norm_reg;
    END IF;

    invoice_number := new_number;
    sequence_num := next_seq;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATED: GENERATE ESTIMATE NUMBER (Per-Vehicle)
-- ============================================

CREATE OR REPLACE FUNCTION generate_estimate_number(vehicle_reg_input VARCHAR DEFAULT NULL)
RETURNS TABLE(estimate_number VARCHAR(50), sequence_num INTEGER, normalized_reg VARCHAR(20)) AS $$
DECLARE
    norm_reg VARCHAR(20);
    next_seq INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Normalize the vehicle registration
    norm_reg := normalize_vehicle_reg(vehicle_reg_input);

    IF norm_reg IS NULL OR norm_reg = '' THEN
        -- Fallback for no vehicle: use global EST-XXXXX format
        SELECT COALESCE(MAX(e.sequence_number), 0) + 1 INTO next_seq
        FROM estimates e
        WHERE e.vehicle_reg IS NULL OR e.vehicle_reg = '';

        new_number := 'EST-' || LPAD(next_seq::TEXT, 5, '0');
        normalized_reg := NULL;
    ELSE
        -- Get the highest sequence number for this vehicle
        SELECT COALESCE(MAX(e.sequence_number), 0) + 1 INTO next_seq
        FROM estimates e
        WHERE normalize_vehicle_reg(e.vehicle_reg) = norm_reg;

        -- Format as VEHICLE_REG-001, VEHICLE_REG-002, etc.
        new_number := norm_reg || '-' || LPAD(next_seq::TEXT, 3, '0');
        normalized_reg := norm_reg;
    END IF;

    estimate_number := new_number;
    sequence_num := next_seq;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION generate_invoice_number(VARCHAR) IS 'Generates vehicle-based invoice numbers in format REG-XXX (e.g., HN14UWY-001). Falls back to INV-XXXXX if no vehicle reg provided.';
COMMENT ON FUNCTION generate_estimate_number(VARCHAR) IS 'Generates vehicle-based estimate numbers in format REG-XXX (e.g., HN14UWY-001). Falls back to EST-XXXXX if no vehicle reg provided.';
