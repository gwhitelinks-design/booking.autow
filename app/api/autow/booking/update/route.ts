import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawAuth = request.headers.get('authorization');
    const token = rawAuth ? rawAuth.replace('Bearer ', '') : null;

    if (!verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Update booking
    const result = await query(
      `UPDATE bookings SET
        service_type = $1,
        booking_date = $2,
        booking_time = $3,
        customer_name = $4,
        customer_phone = $5,
        customer_email = $6,
        vehicle_reg = $7,
        vehicle_make = $8,
        vehicle_model = $9,
        location_address = $10,
        location_postcode = $11,
        issue_description = $12,
        notes = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING id, booking_date, booking_time, customer_name, vehicle_reg`,
      [
        data.service_type,
        data.booking_date,
        data.booking_time,
        data.customer_name,
        data.customer_phone,
        data.customer_email || null,
        data.vehicle_reg.toUpperCase(),
        data.vehicle_make,
        data.vehicle_model,
        data.location_address,
        data.location_postcode.toUpperCase(),
        data.issue_description,
        data.notes || null,
        data.id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking: result.rows[0]
    });

  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
