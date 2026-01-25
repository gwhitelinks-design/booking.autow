import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendTelegramNotification } from '@/lib/telegram';
import { autoAddClient } from '@/lib/auto-add-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawAuth = request.headers.get('authorization');
	const token = rawAuth ? rawAuth.replace('Bearer ', '') : null;

	if (!verifyToken(token)) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'booked_by', 'booking_date', 'booking_time', 'service_type',
      'customer_name', 'customer_phone', 'vehicle_make', 'vehicle_model',
      'vehicle_reg', 'location_address', 'location_postcode', 'issue_description'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Format the data
    const bookingData = {
      booked_by: data.booked_by,
      booking_date: data.booking_date,
      booking_time: data.booking_time + ':00',
      service_type: data.service_type,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone.replace(/\s+/g, ''),
      customer_email: data.customer_email || null,
      vehicle_make: data.vehicle_make,
      vehicle_model: data.vehicle_model,
      vehicle_reg: data.vehicle_reg.toUpperCase(),
      location_address: data.location_address,
      location_postcode: data.location_postcode.toUpperCase(),
      issue_description: data.issue_description,
      notes: data.notes || null,
      status: 'confirmed',
      estimated_duration: 90
    };

    // Check availability
    const availabilityCheck = await query(
      `SELECT * FROM check_availability($1::DATE, $2::TIME, $3)`,
      [bookingData.booking_date, bookingData.booking_time, bookingData.estimated_duration]
    );

    if (!availabilityCheck.rows[0]?.available) {
      return NextResponse.json(
        { success: false, error: 'Time slot unavailable' },
        { status: 400 }
      );
    }

    // Insert booking
    const result = await query(
      `INSERT INTO bookings (
        booked_by, booking_date, booking_time, service_type,
        customer_name, customer_phone, customer_email,
        vehicle_make, vehicle_model, vehicle_reg,
        location_address, location_postcode, issue_description,
        notes, status, estimated_duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        bookingData.booked_by, bookingData.booking_date, bookingData.booking_time,
        bookingData.service_type, bookingData.customer_name, bookingData.customer_phone,
        bookingData.customer_email, bookingData.vehicle_make, bookingData.vehicle_model,
        bookingData.vehicle_reg, bookingData.location_address, bookingData.location_postcode,
        bookingData.issue_description, bookingData.notes, bookingData.status,
        bookingData.estimated_duration
      ]
    );

    // Send Telegram notification (non-blocking)
    sendTelegramNotification(bookingData).catch(err =>
      console.error('Telegram notification failed:', err)
    );

    // Auto-add client to clients table (non-blocking)
    autoAddClient({
      name: bookingData.customer_name,
      email: bookingData.customer_email,
      address: bookingData.location_address,
      phone: bookingData.customer_phone,
      vehicle_reg: bookingData.vehicle_reg,
      vehicle_make: bookingData.vehicle_make,
      vehicle_model: bookingData.vehicle_model,
      created_by: 'Booking'
    }).catch(err => console.error('Auto-add client failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed!',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
