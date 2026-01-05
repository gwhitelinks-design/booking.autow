-- Jotter Notes Table
-- Run this on Supabase SQL Editor

CREATE TABLE IF NOT EXISTS jotter_notes (
    id SERIAL PRIMARY KEY,
    note_number VARCHAR(20) UNIQUE NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'converted')),

    -- Customer Information
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),

    -- Vehicle Information
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_reg VARCHAR(20),
    vehicle_year VARCHAR(10),

    -- Issue/Notes
    issue_description TEXT,
    notes TEXT,
    raw_input TEXT,
    confidence_score DECIMAL(5,4),

    -- Relationships
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,

    -- Metadata
    created_by VARCHAR(100) NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jotter_notes_status ON jotter_notes(status);
CREATE INDEX IF NOT EXISTS idx_jotter_notes_date ON jotter_notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_jotter_notes_vehicle_reg ON jotter_notes(vehicle_reg);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_jotter_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jotter_notes_updated_at ON jotter_notes;
CREATE TRIGGER trigger_jotter_notes_updated_at
    BEFORE UPDATE ON jotter_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_jotter_notes_updated_at();
