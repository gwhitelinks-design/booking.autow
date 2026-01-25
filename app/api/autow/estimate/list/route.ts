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
      SELECT e.*,
        COUNT(*) OVER() as total_count
      FROM estimates e
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }

    query += ` ORDER BY e.estimate_date DESC, e.id DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get line items for each estimate
    const estimateIds = result.rows.map(r => r.id);
    let lineItems: any[] = [];

    if (estimateIds.length > 0) {
      const lineItemsResult = await pool.query(
        `SELECT * FROM line_items
         WHERE document_type = 'estimate' AND document_id = ANY($1)
         ORDER BY document_id, sort_order`,
        [estimateIds]
      );
      lineItems = lineItemsResult.rows;
    }

    // Attach line items to estimates
    const estimates = result.rows.map(estimate => ({
      ...estimate,
      line_items: lineItems.filter(li => li.document_id === estimate.id)
    }));

    return NextResponse.json({
      estimates,
      total: result.rows[0]?.total_count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates', details: error.message },
      { status: 500 }
    );
  }
}
