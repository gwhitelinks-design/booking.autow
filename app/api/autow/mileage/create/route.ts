import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// HMRC Mileage Rates 2025/26
const RATE_FIRST_10K = 0.45;
const RATE_AFTER_10K = 0.25;

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
      notes,
      invoice_id,
    } = body;

    // Validate required fields
    if (!date || !vehicle || !start_location || !destination || !miles) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate rate applied based on YTD miles
    const ytdResult = await pool.query(`
      SELECT COALESCE(SUM(miles), 0) as total_miles
      FROM business_mileage
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM $1::date)
    `, [date]);

    const ytdMiles = parseFloat(ytdResult.rows[0]?.total_miles || 0);
    const milesNum = parseFloat(miles);

    let rateApplied = RATE_FIRST_10K;
    let calculatedClaim = milesNum * RATE_FIRST_10K;

    if (ytdMiles >= 10000) {
      // All at lower rate
      rateApplied = RATE_AFTER_10K;
      calculatedClaim = milesNum * RATE_AFTER_10K;
    } else if (ytdMiles + milesNum > 10000) {
      // Split rate
      const milesAt45p = 10000 - ytdMiles;
      const milesAt25p = milesNum - milesAt45p;
      calculatedClaim = (milesAt45p * RATE_FIRST_10K) + (milesAt25p * RATE_AFTER_10K);
      rateApplied = calculatedClaim / milesNum;
    }

    const finalClaim = claim_amount !== undefined ? claim_amount : Math.round(calculatedClaim * 100) / 100;

    const result = await pool.query(`
      INSERT INTO business_mileage (
        date, vehicle, start_location, destination, purpose, miles, rate_applied, claim_amount, notes, invoice_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [date, vehicle, start_location, destination, purpose || '', miles, Math.round(rateApplied * 100) / 100, finalClaim, notes || '', invoice_id || null]);

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
