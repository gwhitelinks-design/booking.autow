import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      procedure_description,
      include_existing_parts_disclaimer = false,
      include_diagnostic_payment_disclaimer = false,
      customer_name,
      customer_address,
      vehicle_reg,
      vehicle_make,
      vehicle_model,
    } = body;

    if (!procedure_description?.trim()) {
      return NextResponse.json({ error: 'Procedure description is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Generate disclaimer number: DS-YYYYMMDD-XXX
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

      // Get the count of disclaimers created today
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM disclaimers WHERE disclaimer_number LIKE $1`,
        [`DS-${dateStr}-%`]
      );
      const count = parseInt(countResult.rows[0].count, 10) + 1;
      const disclaimerNumber = `DS-${dateStr}-${count.toString().padStart(3, '0')}`;

      // Generate share token
      const shareToken = randomUUID();

      // Insert the disclaimer
      const result = await client.query(
        `INSERT INTO disclaimers (
          disclaimer_number,
          procedure_description,
          include_existing_parts_disclaimer,
          include_diagnostic_payment_disclaimer,
          customer_name,
          customer_address,
          vehicle_reg,
          vehicle_make,
          vehicle_model,
          share_token,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'Staff')
        RETURNING *`,
        [
          disclaimerNumber,
          procedure_description.trim(),
          include_existing_parts_disclaimer,
          include_diagnostic_payment_disclaimer,
          customer_name?.trim() || null,
          customer_address?.trim() || null,
          vehicle_reg?.toUpperCase().trim() || null,
          vehicle_make?.trim() || null,
          vehicle_model?.trim() || null,
          shareToken,
        ]
      );

      const disclaimer = result.rows[0];

      // Build share URL
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/disclaimer/${shareToken}`;

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
    console.error('Error creating disclaimer:', error);
    return NextResponse.json({ error: 'Failed to create disclaimer' }, { status: 500 });
  }
}
