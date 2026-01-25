import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get line items
    const lineItemsResult = await pool.query(
      `SELECT * FROM line_items
       WHERE document_type = 'invoice' AND document_id = $1
       ORDER BY sort_order`,
      [id]
    );

    // Get photos
    const photosResult = await pool.query(
      `SELECT * FROM document_photos
       WHERE document_type = 'invoice' AND document_id = $1
       ORDER BY sort_order`,
      [id]
    );

    // Get business settings
    const settingsResult = await pool.query(
      'SELECT * FROM business_settings WHERE id = 1'
    );

    const invoice = {
      ...invoiceResult.rows[0],
      line_items: lineItemsResult.rows,
      photos: photosResult.rows,
      business_settings: settingsResult.rows[0]
    };

    return NextResponse.json({ invoice });

  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error.message },
      { status: 500 }
    );
  }
}
