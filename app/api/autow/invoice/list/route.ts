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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = `
      SELECT i.*,
        COUNT(*) OVER() as total_count
      FROM invoices i
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }

    query += ` ORDER BY i.invoice_date DESC, i.id DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get line items for each invoice
    const invoiceIds = result.rows.map(r => r.id);
    let lineItems: any[] = [];

    if (invoiceIds.length > 0) {
      const lineItemsResult = await pool.query(
        `SELECT * FROM line_items
         WHERE document_type = 'invoice' AND document_id = ANY($1)
         ORDER BY document_id, sort_order`,
        [invoiceIds]
      );
      lineItems = lineItemsResult.rows;
    }

    // Attach line items to invoices
    const invoices = result.rows.map(invoice => ({
      ...invoice,
      line_items: lineItems.filter(li => li.document_id === invoice.id)
    }));

    return NextResponse.json({
      invoices,
      total: result.rows[0]?.total_count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}
