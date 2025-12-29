// Script to apply estimates and invoices schema to database
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function applySchema() {
  console.log('🔧 Connecting to database...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/estimates-invoices-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Applying schema from estimates-invoices-schema.sql...\n');

    // Execute the schema
    await pool.query(schema);

    console.log('✅ Schema applied successfully!\n');
    console.log('📊 Created tables:');
    console.log('   - estimates');
    console.log('   - invoices');
    console.log('   - line_items');
    console.log('   - document_photos');
    console.log('   - business_settings\n');

    console.log('🔧 Created functions:');
    console.log('   - generate_estimate_number()');
    console.log('   - generate_invoice_number()');
    console.log('   - recalculate_estimate_totals()');
    console.log('   - recalculate_invoice_totals()');
    console.log('   - calculate_line_item_amount()\n');

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('estimates', 'invoices', 'line_items', 'document_photos', 'business_settings')
      ORDER BY table_name
    `);

    console.log('✅ Verified tables in database:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchema();
