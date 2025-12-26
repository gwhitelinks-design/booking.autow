import { Pool } from 'pg';

// Supabase requires SSL but with self-signed certificates
const sslConfig = process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('pooler')
  ? { rejectUnauthorized: false }
  : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
