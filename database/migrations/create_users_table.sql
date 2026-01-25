-- Users Table for AUTOW Booking System
-- Created: 2026-01-25

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',  -- 'admin' or 'staff'
    is_active BOOLEAN DEFAULT true,

    -- Password reset
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,

    -- Timestamps
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Trigger to update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user
-- Password: AutowAdmin2026!
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'gavin@autow-services.co.uk',
    '$2b$10$XpbozDeBqILAb11h2oukiuOEtCy5RLw2Zz1jA6c5t64g3dclfA60u',
    'Gavin',
    'admin'
) ON CONFLICT (email) DO NOTHING;
