import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoice_id,
      expense_date,
      supplier,
      reference_number,
      description,
      parts_amount = 0,
      labour_amount = 0,
      total_amount,
      category = 'general',
      raw_ocr_text,
      confidence_score,
    } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Verify invoice exists
    const invoiceCheck = await pool.query(
      'SELECT id FROM invoices WHERE id = $1',
      [invoice_id]
    );

    if (invoiceCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate total if not provided (parts + labour)
    const calculatedTotal = total_amount || (
      parseFloat(parts_amount) +
      parseFloat(labour_amount)
    );

    const result = await pool.query(
      `INSERT INTO invoice_expenses (
        invoice_id,
        expense_date,
        supplier,
        reference_number,
        description,
        parts_amount,
        labour_amount,
        total_amount,
        category,
        raw_ocr_text,
        confidence_score,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        invoice_id,
        expense_date || null,
        supplier || null,
        reference_number || null,
        description || null,
        parseFloat(parts_amount) || 0,
        parseFloat(labour_amount) || 0,
        parseFloat(calculatedTotal) || 0,
        category,
        raw_ocr_text || null,
        confidence_score || null,
        'staff',
      ]
    );

    return NextResponse.json({
      success: true,
      expense: result.rows[0],
    });

  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense', details: error.message },
      { status: 500 }
    );
  }
}
