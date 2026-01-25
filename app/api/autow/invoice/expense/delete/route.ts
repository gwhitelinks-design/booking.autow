import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    // Verify expense exists
    const expenseCheck = await pool.query(
      'SELECT id, invoice_id FROM invoice_expenses WHERE id = $1',
      [id]
    );

    if (expenseCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Delete the expense
    await pool.query('DELETE FROM invoice_expenses WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense', details: error.message },
      { status: 500 }
    );
  }
}
