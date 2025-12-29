import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Add user_id column to estimates and invoices if missing
      await client.query(`
        -- Add user_id to estimates table
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS user_id INTEGER;

        -- Add user_id to invoices table
        ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS user_id INTEGER;

        -- Add estimate_number to estimates table
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS estimate_number VARCHAR(50);

        -- Add invoice_number, invoice_date, and due_date to invoices table
        ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS invoice_date DATE,
        ADD COLUMN IF NOT EXISTS due_date DATE;

        -- Add estimate_date to estimates table
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS estimate_date DATE DEFAULT CURRENT_DATE;

        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_estimates_estimate_number ON estimates(estimate_number);
        CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
        CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
      `);

      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 });
  }
}
