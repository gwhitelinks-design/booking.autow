import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Find estimate by share token
      const result = await client.query(
        `SELECT e.*,
          json_agg(
            json_build_object(
              'id', li.id,
              'description', li.description,
              'item_type', li.item_type,
              'rate', li.rate,
              'quantity', li.quantity,
              'amount', li.amount,
              'sort_order', li.sort_order
            ) ORDER BY li.sort_order
          ) FILTER (WHERE li.id IS NOT NULL) as line_items
         FROM estimates e
         LEFT JOIN line_items li ON li.document_type = 'estimate' AND li.document_id = e.id
         WHERE e.share_token = $1
         GROUP BY e.id`,
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Estimate not found or link expired' }, { status: 404 });
      }

      const estimate = result.rows[0];

      // Record the view
      const ipAddress = request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       'unknown';
      const userAgent = request.headers.get('user-agent') || '';

      await client.query(
        `INSERT INTO document_views (document_type, document_id, ip_address, user_agent)
         VALUES ('estimate', $1, $2, $3)`,
        [estimate.id, ipAddress, userAgent]
      );

      // Update view count and last viewed
      await client.query(
        `UPDATE estimates
         SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [estimate.id]
      );

      // Get business settings
      const settingsResult = await client.query(
        'SELECT * FROM business_settings WHERE user_id = $1 LIMIT 1',
        [estimate.user_id]
      );

      return NextResponse.json({
        estimate,
        business_settings: settingsResult.rows[0] || null
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching shared estimate:', error);
    return NextResponse.json({ error: 'Failed to load estimate' }, { status: 500 });
  }
}
