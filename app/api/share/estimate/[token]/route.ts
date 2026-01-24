import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendShareLinkNotification } from '@/lib/telegram';

// Disable caching to ensure notification fires on every view
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Find estimate by share_token
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

      // Get business settings (try without user_id filter if it doesn't exist)
      let businessSettings = null;
      try {
        const settingsResult = await client.query(
          'SELECT * FROM business_settings LIMIT 1'
        );
        businessSettings = settingsResult.rows[0] || null;
      } catch (settingsError) {
        console.error('Business settings query failed:', settingsError);
        // Continue without business settings
      }

      // Send Telegram notification (non-blocking)
      sendShareLinkNotification('estimate', estimate).catch(err =>
        console.error('Telegram notification failed:', err)
      );

      return NextResponse.json({
        estimate,
        business_settings: businessSettings
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching shared estimate:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({
      error: 'Failed to load estimate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
