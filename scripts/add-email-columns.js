const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kctnocfwcomphprybnud:e9QyTh454JWulJIT@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addEmailColumns() {
  try {
    console.log('Adding email tracking columns to vehicle_reports...');

    await pool.query(`
      ALTER TABLE vehicle_reports
      ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS email_sent_to VARCHAR(255)
    `);

    console.log('Email columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
}

addEmailColumns();
