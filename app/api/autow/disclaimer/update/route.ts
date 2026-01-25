import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      procedure_description,
      include_existing_parts_disclaimer = false,
      include_diagnostic_payment_disclaimer = false,
      customer_name,
      customer_address,
      vehicle_reg,
      vehicle_make,
      vehicle_model,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Disclaimer ID is required' }, { status: 400 });
    }

    if (!procedure_description?.trim()) {
      return NextResponse.json({ error: 'Procedure description is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE disclaimers SET
          procedure_description = $1,
          include_existing_parts_disclaimer = $2,
          include_diagnostic_payment_disclaimer = $3,
          customer_name = $4,
          customer_address = $5,
          vehicle_reg = $6,
          vehicle_make = $7,
          vehicle_model = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *`,
        [
          procedure_description.trim(),
          include_existing_parts_disclaimer,
          include_diagnostic_payment_disclaimer,
          customer_name?.trim() || null,
          customer_address?.trim() || null,
          vehicle_reg?.toUpperCase().trim() || null,
          vehicle_make?.trim() || null,
          vehicle_model?.trim() || null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Disclaimer not found' }, { status: 404 });
      }

      const disclaimer = result.rows[0];

      // Build share URL
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/disclaimer/${disclaimer.share_token}`;

      return NextResponse.json({
        success: true,
        disclaimer: {
          ...disclaimer,
          share_url: shareUrl,
        },
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating disclaimer:', error);
    return NextResponse.json({ error: 'Failed to update disclaimer' }, { status: 500 });
  }
}
