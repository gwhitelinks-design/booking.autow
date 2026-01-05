-- AUTOW Damage Assessments Schema
-- Add this to the existing database

-- Create damage_assessments table
CREATE TABLE IF NOT EXISTS damage_assessments (
    id SERIAL PRIMARY KEY,

    -- Vehicle Information
    vehicle_reg VARCHAR(20) NOT NULL,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_engine VARCHAR(100),
    vehicle_colour VARCHAR(50),
    vehicle_first_registered DATE,
    vehicle_mot_status VARCHAR(255),
    vehicle_tax_status VARCHAR(255),

    -- Assessment Details
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessor_name VARCHAR(255),
    video_url VARCHAR(500),

    -- Summary Counts
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    photo_count INTEGER DEFAULT 0,

    -- Critical Issues Summary (JSON array)
    critical_issues JSONB DEFAULT '[]',

    -- All Damage Items (JSON array of objects)
    -- Each item: {section, component, damage, assessment, priority, status}
    damage_items JSONB DEFAULT '[]',

    -- Cost Estimates (JSON array of objects)
    -- Each item: {category, components, parts_min, parts_max, labour_min, labour_max, subtotal_min, subtotal_max}
    cost_estimates JSONB DEFAULT '[]',

    -- Totals
    repair_cost_min DECIMAL(10,2) DEFAULT 0,
    repair_cost_max DECIMAL(10,2) DEFAULT 0,
    vehicle_value_min DECIMAL(10,2) DEFAULT 0,
    vehicle_value_max DECIMAL(10,2) DEFAULT 0,

    -- Insurance Recommendation
    recommendation VARCHAR(100), -- 'write-off', 'repair', 'undecided'
    write_off_category VARCHAR(20), -- 'A', 'B', 'S', 'N'
    recommendation_notes TEXT,

    -- General Notes
    notes TEXT,

    -- Share Link
    share_token UUID UNIQUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_damage_assessments_vehicle_reg ON damage_assessments(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_damage_assessments_share_token ON damage_assessments(share_token);
CREATE INDEX IF NOT EXISTS idx_damage_assessments_assessment_date ON damage_assessments(assessment_date);

-- Add trigger for updated_at
CREATE TRIGGER update_damage_assessments_updated_at
    BEFORE UPDATE ON damage_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
