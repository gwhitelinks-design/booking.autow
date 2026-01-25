import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      category,
      subcategory,
      description,
      supplier,
      amount,
      vat,
      payment_method,
      tax_deductible_percent,
      is_recurring,
      allowable_for_tax,
      notes,
      invoice_id,
    } = body;

    // Validate required fields
    if (!date || !category || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, category, description, amount' },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      INSERT INTO business_expenses (
        date, category, subcategory, description, supplier,
        amount, vat, payment_method, tax_deductible_percent, is_recurring,
        allowable_for_tax, notes, invoice_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      date,
      category,
      subcategory || '',
      description,
      supplier || '',
      amount,
      vat || 0,
      payment_method || '',
      tax_deductible_percent || 100,
      is_recurring || false,
      allowable_for_tax !== false,
      notes || '',
      invoice_id || null,
    ]);

    return NextResponse.json({
      entry: result.rows[0],
      message: 'Expense created successfully',
    });

  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense', details: error.message },
      { status: 500 }
    );
  }
}
