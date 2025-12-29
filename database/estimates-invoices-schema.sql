-- AUTOW Estimates and Invoices Schema
-- Add to existing database

-- ============================================
-- ESTIMATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,

    -- Document Details
    estimate_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "UWY001"
    estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',  -- draft, sent, accepted, declined, converted

    -- Client Information (Bill To)
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_address TEXT,
    client_phone VARCHAR(20),
    client_mobile VARCHAR(20),
    client_fax VARCHAR(20),

    -- Vehicle Information (if applicable)
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_reg VARCHAR(20),

    -- Financial Details
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,  -- VAT percentage (e.g., 20.00 for 20%)
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Additional Information
    notes TEXT,  -- Custom notes/terms
    signature_data TEXT,  -- Base64 encoded signature image

    -- Link to booking (optional)
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,

    -- Link to invoice (when converted)
    invoice_id INTEGER,  -- Will reference invoices table

    -- Metadata
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,  -- When estimate was emailed
    accepted_at TIMESTAMP  -- When client accepted
);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,

    -- Document Details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "INV-UWY001"
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,  -- Payment due date
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, paid, overdue, cancelled

    -- Client Information (Bill To)
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_address TEXT,
    client_phone VARCHAR(20),
    client_mobile VARCHAR(20),
    client_fax VARCHAR(20),

    -- Vehicle Information (if applicable)
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_reg VARCHAR(20),

    -- Financial Details
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Payment Information
    payment_method VARCHAR(50),  -- BACS, Cash, Card, etc.
    payment_date DATE,
    payment_reference VARCHAR(100),

    -- Bank Details (for display on invoice)
    bank_account_name VARCHAR(255) DEFAULT 'Gavin White',
    bank_sort_code VARCHAR(20) DEFAULT '04-06-05',
    bank_account_number VARCHAR(20) DEFAULT '20052044',
    bank_account_type VARCHAR(50) DEFAULT 'Business Account',

    -- Additional Information
    notes TEXT,
    signature_data TEXT,

    -- Links
    estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,

    -- Metadata
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- ============================================
-- LINE ITEMS TABLE (for both estimates and invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS line_items (
    id SERIAL PRIMARY KEY,

    -- Polymorphic relationship (can belong to estimate OR invoice)
    document_type VARCHAR(20) NOT NULL,  -- 'estimate' or 'invoice'
    document_id INTEGER NOT NULL,  -- ID of estimate or invoice

    -- Line Item Details
    description TEXT NOT NULL,
    item_type VARCHAR(50) NOT NULL DEFAULT 'service',  -- service, part, labor, other

    -- Pricing
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Price per unit
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,  -- Quantity
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Calculated: rate × quantity

    -- Display Order
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint to ensure document_id matches appropriate table
    CHECK (document_type IN ('estimate', 'invoice'))
);

-- ============================================
-- DOCUMENT PHOTOS TABLE (optional)
-- ============================================
CREATE TABLE IF NOT EXISTS document_photos (
    id SERIAL PRIMARY KEY,

    -- Polymorphic relationship
    document_type VARCHAR(20) NOT NULL,  -- 'estimate' or 'invoice'
    document_id INTEGER NOT NULL,

    -- Photo Details
    photo_url TEXT NOT NULL,  -- URL or path to photo
    photo_data TEXT,  -- Base64 encoded photo (if storing in DB)
    caption VARCHAR(255),

    -- Display Order
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (document_type IN ('estimate', 'invoice'))
);

-- ============================================
-- BUSINESS SETTINGS TABLE (for "From" details)
-- ============================================
CREATE TABLE IF NOT EXISTS business_settings (
    id SERIAL PRIMARY KEY,

    -- Business Details
    business_name VARCHAR(255) NOT NULL DEFAULT 'AUTOW Services',
    email VARCHAR(255) NOT NULL DEFAULT 'info@autow-services.co.uk',
    address TEXT NOT NULL DEFAULT 'Alverton, Penzance, TR18 4QB',
    workshop_location VARCHAR(255) DEFAULT 'WORKSHOP LOCATION PENZANCE',
    phone VARCHAR(20) NOT NULL DEFAULT '07352968276',
    vat_number VARCHAR(50) DEFAULT '123456789',
    website VARCHAR(255) DEFAULT 'https://www.autow-services.co.uk',
    owner_name VARCHAR(255) DEFAULT 'Business owner name',

    -- Bank Details (default)
    bank_account_name VARCHAR(255) DEFAULT 'Gavin White',
    bank_sort_code VARCHAR(20) DEFAULT '04-06-05',
    bank_account_number VARCHAR(20) DEFAULT '20052044',
    bank_account_type VARCHAR(50) DEFAULT 'Business Account',

    -- Default Terms/Notes
    default_estimate_notes TEXT DEFAULT 'We Provide Mobile mechanics and Recovery services, we do have dedicated ramp spaces for works that are not suitable at roadside etc

PARTS AND / OR VEHICLE COLLECTION / RECOVERY REQUIRED UPFRONT.

LABOUR ON COMPLETION

Best Regards

J & G AuToW Services',

    default_invoice_notes TEXT DEFAULT 'Payment due within 7 days of invoice date.

BACS DETAILS:
Account Name: Gavin White
S/C: 04-06-05
A/N: 20052044
(Business Account)

Thank you for your business!',

    -- Metadata
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Estimates indexes
CREATE INDEX IF NOT EXISTS idx_estimates_number ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_date ON estimates(estimate_date);
CREATE INDEX IF NOT EXISTS idx_estimates_client_name ON estimates(client_name);
CREATE INDEX IF NOT EXISTS idx_estimates_booking_id ON estimates(booking_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices(client_name);
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON invoices(estimate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);

-- Line items indexes
CREATE INDEX IF NOT EXISTS idx_line_items_document ON line_items(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_line_items_sort ON line_items(document_type, document_id, sort_order);

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_document ON document_photos(document_type, document_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps on estimates
CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamps on invoices
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamps on line items
CREATE TRIGGER update_line_items_updated_at
    BEFORE UPDATE ON line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate next estimate number
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Get the highest number currently in use
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(estimate_number FROM 4) AS INTEGER)),
        0
    ) + 1 INTO next_num
    FROM estimates
    WHERE estimate_number ~ '^UWY[0-9]+$';

    -- Format as UWY001, UWY002, etc.
    new_number := 'UWY' || LPAD(next_num::TEXT, 3, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Get the highest number currently in use
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)),
        0
    ) + 1 INTO next_num
    FROM invoices
    WHERE invoice_number ~ '^INV-UWY[0-9]+$';

    -- Format as INV-UWY001, INV-UWY002, etc.
    new_number := 'INV-UWY' || LPAD(next_num::TEXT, 3, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate line item amount
CREATE OR REPLACE FUNCTION calculate_line_item_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.amount := NEW.rate * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate line item amounts
CREATE TRIGGER calculate_line_item_amount_trigger
    BEFORE INSERT OR UPDATE ON line_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_line_item_amount();

-- Function to recalculate estimate totals
CREATE OR REPLACE FUNCTION recalculate_estimate_totals(estimate_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    calc_subtotal DECIMAL(10, 2);
    calc_vat DECIMAL(10, 2);
    calc_total DECIMAL(10, 2);
    vat_rate_value DECIMAL(5, 2);
BEGIN
    -- Get VAT rate for this estimate
    SELECT vat_rate INTO vat_rate_value FROM estimates WHERE id = estimate_id_param;

    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(amount), 0) INTO calc_subtotal
    FROM line_items
    WHERE document_type = 'estimate' AND document_id = estimate_id_param;

    -- Calculate VAT and total
    calc_vat := ROUND(calc_subtotal * (vat_rate_value / 100), 2);
    calc_total := calc_subtotal + calc_vat;

    -- Update estimate
    UPDATE estimates
    SET subtotal = calc_subtotal,
        vat_amount = calc_vat,
        total = calc_total
    WHERE id = estimate_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate invoice totals
CREATE OR REPLACE FUNCTION recalculate_invoice_totals(invoice_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    calc_subtotal DECIMAL(10, 2);
    calc_vat DECIMAL(10, 2);
    calc_total DECIMAL(10, 2);
    vat_rate_value DECIMAL(5, 2);
    paid_amount DECIMAL(10, 2);
BEGIN
    -- Get VAT rate and amount paid for this invoice
    SELECT vat_rate, amount_paid INTO vat_rate_value, paid_amount
    FROM invoices
    WHERE id = invoice_id_param;

    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(amount), 0) INTO calc_subtotal
    FROM line_items
    WHERE document_type = 'invoice' AND document_id = invoice_id_param;

    -- Calculate VAT and total
    calc_vat := ROUND(calc_subtotal * (vat_rate_value / 100), 2);
    calc_total := calc_subtotal + calc_vat;

    -- Update invoice
    UPDATE invoices
    SET subtotal = calc_subtotal,
        vat_amount = calc_vat,
        total = calc_total,
        balance_due = calc_total - COALESCE(paid_amount, 0)
    WHERE id = invoice_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default business settings
INSERT INTO business_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================

-- Sample estimate
-- INSERT INTO estimates (
--     estimate_number, client_name, client_email, client_address,
--     client_phone, client_mobile, created_by, notes
-- ) VALUES (
--     'UWY001', 'Daniel Boardman', 'name@client.com',
--     'Trezelah, Galvanised, Penzance, TR20 8XD',
--     '(123) 456 789', '07774860275', 'Admin',
--     'We Provide Mobile mechanics and Recovery services...'
-- );

-- Sample line items for estimate
-- INSERT INTO line_items (document_type, document_id, description, rate, quantity, sort_order) VALUES
-- ('estimate', 1, 'Out of hours Recovery Helston', 240.00, 1, 1),
-- ('estimate', 1, 'Storage fees - Please Note! Storage fees will be applied if you have not agreed to have any repair work carried out by AUTOW Services.', 55.00, 0, 2);

-- Recalculate totals
-- SELECT recalculate_estimate_totals(1);
