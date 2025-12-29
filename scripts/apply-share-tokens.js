const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    const sqlPath = path.join(__dirname, '..', 'database', 'add-share-tokens.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying share tokens migration...');
    await client.query(sql);
    console.log('✓ Migration applied successfully');
    console.log('✓ Added share_token, share_token_created_at, view_count, last_viewed_at columns');
    console.log('✓ Created document_views table');
    console.log('✓ Created generate_share_token() function');

  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
