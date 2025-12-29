import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const vehicleReg = decodeURIComponent(token); // token is actually the vehicle_reg

    if (!vehicleReg) {
      return NextResponse.json({ error: 'Vehicle registration is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Find invoice by vehicle_reg
      const result = await client.query(
        `SELECT i.*,
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
         FROM invoices i
         LEFT JOIN line_items li ON li.document_type = 'invoice' AND li.document_id = i.id
         WHERE i.vehicle_reg = $1
         GROUP BY i.id
         ORDER BY i.id DESC
         LIMIT 1`,
        [vehicleReg]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Invoice not found or link expired' }, { status: 404 });
      }

      const invoice = result.rows[0];

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

      return NextResponse.json({
        invoice,
        business_settings: businessSettings
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching shared invoice:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({
      error: 'Failed to load invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
