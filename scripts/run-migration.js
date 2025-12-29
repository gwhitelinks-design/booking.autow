const pool = require('../lib/db.js').default;
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../database/add-document-numbers.sql'),
      'utf8'
    );

    console.log('Running migration: add-document-numbers.sql');
    await pool.query(sql);
    console.log('Migration completed successfully!');

    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'estimates'
      AND column_name IN ('estimate_number', 'estimate_date')
    `);

    console.log('Columns added:', result.rows.map(r => r.column_name));

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
