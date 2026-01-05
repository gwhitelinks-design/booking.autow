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
      customer_name,
      customer_phone,
      customer_email,
      vehicle_make,
      vehicle_model,
      vehicle_reg,
      vehicle_year,
      issue_description,
      notes,
      raw_input,
      confidence_score,
      created_by = 'Staff'
    } = body;

    // Generate note number (JN-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jotter_notes WHERE DATE(note_date) = CURRENT_DATE`
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const note_number = `JN-${dateStr}-${count.toString().padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO jotter_notes (
        note_number, note_date, status,
        customer_name, customer_phone, customer_email,
        vehicle_make, vehicle_model, vehicle_reg, vehicle_year,
        issue_description, notes, raw_input, confidence_score,
        created_by
      ) VALUES (
        $1, CURRENT_DATE, 'draft',
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        note_number,
        customer_name, customer_phone, customer_email,
        vehicle_make, vehicle_model, vehicle_reg, vehicle_year,
        issue_description, notes, raw_input, confidence_score,
        created_by
      ]
    );

    return NextResponse.json({
      message: 'Note created successfully',
      note: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}
