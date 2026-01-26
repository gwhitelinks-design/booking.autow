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
      id,
      date,
      vehicle,
      start_location,
      destination,
      purpose,
      miles,
      notes,
      invoice_id,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Missing entry ID' },
        { status: 400 }
      );
    }

    if (!date || !vehicle || !start_location || !destination || !miles) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current entry to check if it exists
    const currentEntry = await pool.query(
      'SELECT * FROM business_mileage WHERE id = $1',
      [id]
    );

    if (currentEntry.rows.length === 0) {
      return NextResponse.json(
        { error: 'Mileage entry not found' },
        { status: 404 }
      );
    }

    const milesNum = parseFloat(miles);
    const originalMiles = parseFloat(currentEntry.rows[0].miles);

    // Recalculate claim amount based on YTD miles (excluding this entry)
    const ytdResult = await pool.query(`
      SELECT COALESCE(SUM(miles), 0) as total_miles
      FROM business_mileage
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM $1::date)
        AND id != $2
    `, [date, id]);

    const ytdMilesExcludingThis = parseFloat(ytdResult.rows[0]?.total_miles || 0);

    // Calculate rate and claim for the updated entry
    let rateApplied = RATE_FIRST_10K;
    let calculatedClaim = milesNum * RATE_FIRST_10K;

    if (ytdMilesExcludingThis >= 10000) {
      // All at lower rate
      rateApplied = RATE_AFTER_10K;
      calculatedClaim = milesNum * RATE_AFTER_10K;
    } else if (ytdMilesExcludingThis + milesNum > 10000) {
      // Split rate
      const milesAt45p = 10000 - ytdMilesExcludingThis;
      const milesAt25p = milesNum - milesAt45p;
      calculatedClaim = (milesAt45p * RATE_FIRST_10K) + (milesAt25p * RATE_AFTER_10K);
      rateApplied = calculatedClaim / milesNum;
    }

    const claimAmount = Math.round(calculatedClaim * 100) / 100;

    // Update the entry
    const result = await pool.query(`
      UPDATE business_mileage SET
        date = $1,
        vehicle = $2,
        start_location = $3,
        destination = $4,
        purpose = $5,
        miles = $6,
        rate_applied = $7,
        claim_amount = $8,
        notes = $9,
        invoice_id = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      date,
      vehicle,
      start_location,
      destination,
      purpose || '',
      miles,
      Math.round(rateApplied * 100) / 100,
      claimAmount,
      notes || '',
      invoice_id || null,
      id
    ]);

    return NextResponse.json({
      entry: result.rows[0],
      message: 'Mileage entry updated successfully',
      rateInfo: {
        ytdMiles: ytdMilesExcludingThis + milesNum,
        rateApplied: Math.round(rateApplied * 100) / 100,
        claimAmount,
      }
    });

  } catch (error: any) {
    console.error('Error updating mileage entry:', error);
    return NextResponse.json(
      { error: 'Failed to update mileage entry', details: error.message },
      { status: 500 }
    );
  }
}
