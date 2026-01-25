import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// Preview the next document number without creating a record
// This is used to show the user what number will be assigned
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicle_reg = searchParams.get('vehicle_reg');
    const document_type = searchParams.get('type') || 'estimate'; // 'estimate' or 'invoice'

    if (document_type === 'estimate') {
      const result = await pool.query(
        'SELECT * FROM generate_estimate_number($1)',
        [vehicle_reg || null]
      );

      return NextResponse.json({
        success: true,
        document_number: result.rows[0].estimate_number,
        sequence_number: result.rows[0].sequence_num,
        normalized_reg: result.rows[0].normalized_reg,
        document_type: 'estimate'
      });
    } else if (document_type === 'invoice') {
      const result = await pool.query(
        'SELECT * FROM generate_invoice_number($1)',
        [vehicle_reg || null]
      );

      return NextResponse.json({
        success: true,
        document_number: result.rows[0].invoice_number,
        sequence_number: result.rows[0].sequence_num,
        normalized_reg: result.rows[0].normalized_reg,
        document_type: 'invoice'
      });
    } else {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error previewing document number:', error);
    return NextResponse.json(
      { error: 'Failed to preview document number', details: error.message },
      { status: 500 }
    );
  }
}
