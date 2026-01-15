const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kctnocfwcomphprybnud:e9QyTh454JWulJIT@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_reports (
        id SERIAL PRIMARY KEY,
        report_number VARCHAR(50) UNIQUE NOT NULL,
        report_date DATE NOT NULL DEFAULT CURRENT_DATE,
        service_type VARCHAR(50) NOT NULL,
        vehicle_reg VARCHAR(20) NOT NULL,
        vehicle_type_model VARCHAR(255),
        vehicle_weight VARCHAR(100),
        pickup_location TEXT,
        delivery_location TEXT,
        time_arrival TIME,
        time_depart TIME,
        customer_name VARCHAR(255) NOT NULL,
        customer_address TEXT,
        customer_phone VARCHAR(20),
        customer_email VARCHAR(255),
        known_issues TEXT,
        risk_procedure_description TEXT,
        risk_procedure_signature TEXT,
        damage_markers JSONB DEFAULT '[]',
        notes TEXT,
        video_file_code VARCHAR(255),
        customer_signature TEXT,
        customer_signature_date DATE,
        driver_signature TEXT,
        driver_signature_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        created_by VARCHAR(255) NOT NULL DEFAULT 'Staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table created');

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vehicle_reports_number ON vehicle_reports(report_number)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vehicle_reports_date ON vehicle_reports(report_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vehicle_reports_vehicle_reg ON vehicle_reports(vehicle_reg)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vehicle_reports_status ON vehicle_reports(status)');
    console.log('Indexes created');

    // Create function for generating report numbers
    await pool.query(`
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
      $$ LANGUAGE plpgsql
    `);
    console.log('Function created');

    await pool.end();
    console.log('Migration complete!');
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
