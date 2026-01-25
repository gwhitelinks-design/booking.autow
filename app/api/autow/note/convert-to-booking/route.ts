import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { note_id, booking_date, booking_time, location_address, location_postcode, service_type = 'Mobile Mechanic' } = body;

    if (!note_id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    if (!booking_date || !booking_time) {
      return NextResponse.json({ error: 'Booking date and time are required' }, { status: 400 });
    }

    // Get the note
    const noteResult = await pool.query(
      'SELECT * FROM jotter_notes WHERE id = $1',
      [note_id]
    );

    if (noteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = noteResult.rows[0];

    // Create booking from note
    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        booked_by, booking_date, booking_time, service_type,
        customer_name, customer_phone, customer_email,
        vehicle_make, vehicle_model, vehicle_reg,
        location_address, location_postcode,
        issue_description, notes, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'confirmed'
      ) RETURNING *`,
      [
        note.created_by || 'Staff',
        booking_date,
        booking_time,
        service_type,
        note.customer_name || '',
        note.customer_phone || '',
        note.customer_email || '',
        note.vehicle_make || '',
        note.vehicle_model || '',
        note.vehicle_reg || '',
        location_address || '',
        location_postcode || '',
        note.issue_description || '',
        note.notes || ''
      ]
    );

    const booking = bookingResult.rows[0];

    // Update note status and link to booking
    await pool.query(
      `UPDATE jotter_notes SET status = 'converted', booking_id = $1, converted_at = NOW() WHERE id = $2`,
      [booking.id, note_id]
    );

    return NextResponse.json({
      message: 'Note converted to booking successfully',
      booking,
      note_id
    });

  } catch (error: any) {
    console.error('Error converting note to booking:', error);
    return NextResponse.json(
      { error: 'Failed to convert note', details: error.message },
      { status: 500 }
    );
  }
}
