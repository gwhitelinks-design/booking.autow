import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      vehicle,
      start_location,
      destination,
      purpose,
      miles,
      claim_amount,
    } = body;

    // Validate required fields
    if (!date || !vehicle || !start_location || !destination || !miles) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      INSERT INTO mileage_entries (
        date, vehicle, start_location, destination, purpose, miles, claim_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [date, vehicle, start_location, destination, purpose || '', miles, claim_amount || 0]);

    return NextResponse.json({
      entry: result.rows[0],
      message: 'Mileage entry created successfully',
    });

  } catch (error: any) {
    console.error('Error creating mileage entry:', error);
    return NextResponse.json(
      { error: 'Failed to create mileage entry', details: error.message },
      { status: 500 }
    );
  }
}
