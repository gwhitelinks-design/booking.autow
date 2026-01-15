import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get paid invoices total
    const invoicesResult = await pool.query(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total_invoiced,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as total_received
      FROM invoices
      WHERE status = 'paid'
    `);

    const invoiceStats = invoicesResult.rows[0];

    // Get receipts count and total
    const receiptsResult = await pool.query(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM receipts
    `);

    const receiptStats = receiptsResult.rows[0];

    // Get expenses total (check if table exists first)
    let expensesTotal = 0;
    try {
      const expensesResult = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
      `);
      expensesTotal = parseFloat(expensesResult.rows[0]?.total || 0);
    } catch (e) {
      // Table might not exist yet
      console.log('Expenses table not found, using 0');
    }

    // Get mileage claim total (check if table exists first)
    let mileageClaim = 0;
    try {
      const mileageResult = await pool.query(`
        SELECT COALESCE(SUM(claim_amount), 0) as total
        FROM mileage_entries
      `);
      mileageClaim = parseFloat(mileageResult.rows[0]?.total || 0);
    } catch (e) {
      // Table might not exist yet
      console.log('Mileage table not found, using 0');
    }

    return NextResponse.json({
      totalInvoiced: parseFloat(invoiceStats.total_invoiced) || 0,
      totalReceived: parseFloat(invoiceStats.total_received) || 0,
      paidInvoiceCount: parseInt(invoiceStats.count) || 0,
      receiptCount: parseInt(receiptStats.count) || 0,
      totalExpenses: expensesTotal,
      mileageClaim: mileageClaim,
    });

  } catch (error: any) {
    console.error('Error fetching business hub summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary', details: error.message },
      { status: 500 }
    );
  }
}
