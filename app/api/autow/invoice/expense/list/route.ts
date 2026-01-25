import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoice_id = searchParams.get('invoice_id');

    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT * FROM invoice_expenses
       WHERE invoice_id = $1
       ORDER BY expense_date DESC, created_at DESC`,
      [invoice_id]
    );

    // Calculate totals (Parts + Labour only)
    const totals = result.rows.reduce((acc, expense) => {
      acc.parts += parseFloat(expense.parts_amount) || 0;
      acc.labour += parseFloat(expense.labour_amount) || 0;
      acc.total += parseFloat(expense.total_amount) || 0;
      return acc;
    }, { parts: 0, labour: 0, total: 0 });

    return NextResponse.json({
      success: true,
      expenses: result.rows,
      totals,
      count: result.rows.length,
    });

  } catch (error: any) {
    console.error('Error listing expenses:', error);
    return NextResponse.json(
      { error: 'Failed to list expenses', details: error.message },
      { status: 500 }
    );
  }
}
