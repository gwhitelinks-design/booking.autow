const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kctnocfwcomphprybnud:e9QyTh454JWulJIT@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addShareTokenColumn() {
  try {
    console.log('Adding share_token column to vehicle_reports...');

    await pool.query(`
      ALTER TABLE vehicle_reports
      ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE
    `);

    console.log('share_token column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

addShareTokenColumn();
