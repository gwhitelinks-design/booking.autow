-- Vehicle Reports / Check Reports Table
CREATE TABLE IF NOT EXISTS vehicle_reports (
    id SERIAL PRIMARY KEY,

    -- Report Details
    report_number VARCHAR(50) UNIQUE NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Service Type
    service_type VARCHAR(50) NOT NULL, -- 'repair' or 'recovery'

    -- Vehicle Information
    vehicle_reg VARCHAR(20) NOT NULL,
    vehicle_type_model VARCHAR(255),
    vehicle_weight VARCHAR(100),

    -- Locations
    pickup_location TEXT,
    delivery_location TEXT,

    -- Times
    time_arrival TIME,
    time_depart TIME,

    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),

    -- Known Issues
    known_issues TEXT,

    -- Risk Procedure
    risk_procedure_description TEXT,
    risk_procedure_signature TEXT, -- Base64 signature

    -- Vehicle Condition Diagram
    damage_markers JSONB DEFAULT '[]', -- Array of {x, y, number, note}

    -- Notes
    notes TEXT,

    -- Video Reference
    video_file_code VARCHAR(255),

    -- Final Signatures
    customer_signature TEXT, -- Base64 signature
    customer_signature_date DATE,
    driver_signature TEXT, -- Base64 signature
    driver_signature_date DATE,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, completed, archived

    -- Link to booking (optional)
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,

    -- Metadata
    created_by VARCHAR(255) NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_reports_number ON vehicle_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_reports_date ON vehicle_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_reports_vehicle_reg ON vehicle_reports(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_vehicle_reports_status ON vehicle_reports(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_reports_customer ON vehicle_reports(customer_name);

-- Function to generate report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(report_number FROM 5) AS INTEGER)),
        0
    ) + 1 INTO next_num
    FROM vehicle_reports
    WHERE report_number ~ '^VCR-[0-9]+$';

    new_number := 'VCR-' || LPAD(next_num::TEXT, 4, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_reports_updated_at
    BEFORE UPDATE ON vehicle_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
