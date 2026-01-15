-- Business Hub Tables Migration
-- For mileage tracking, expenses management

-- =====================================================
-- MILEAGE ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mileage_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    vehicle VARCHAR(50) NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    purpose VARCHAR(255),
    miles DECIMAL(10,2) NOT NULL,
    claim_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for mileage
CREATE INDEX IF NOT EXISTS idx_mileage_date ON mileage_entries(date);
CREATE INDEX IF NOT EXISTS idx_mileage_user ON mileage_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_vehicle ON mileage_entries(vehicle);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100),
    description VARCHAR(255) NOT NULL,
    supplier VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    vat DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    tax_deductible_percent INTEGER DEFAULT 100,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
-- Mileage trigger
CREATE TRIGGER update_mileage_updated_at
    BEFORE UPDATE ON mileage_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Expenses trigger
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HMRC MILEAGE RATES REFERENCE (2025/26)
-- First 10,000 miles: 45p per mile
-- After 10,000 miles: 25p per mile
-- =====================================================

-- =====================================================
-- EXPENSE CATEGORIES REFERENCE
-- VEHICLES - FINANCE: Ford Ranger HP, Partner Car Finance, Recovery Truck HP
-- VEHICLES - RUNNING: Fuel, MOT, Road Tax, Repairs, Tyres, Service
-- INSURANCE: Motor Traders, Public Liability, Employers, Tools
-- PREMISES: Bay Rental, Electricity, Internet, Storage
-- COMMUNICATIONS: Mobile Phone, Broadband
-- CLOTHING & PPE: Overalls, Boots, Gloves, Safety Gear
-- TOOLS & EQUIPMENT: Hand Tools, Power Tools, Diagnostics, Lifting
-- CONSUMABLES: Oils & Fluids, Cleaning, Fasteners, Tape & Adhesives
-- PROFESSIONAL: Accountant, Legal, Bank Charges, Software
-- STAFF: Salaries, Wages, Pensions, Training
-- =====================================================
