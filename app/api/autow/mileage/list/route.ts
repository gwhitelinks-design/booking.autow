import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT * FROM business_mileage
      ORDER BY date DESC, id DESC
    `);

    return NextResponse.json({
      entries: result.rows,
      count: result.rows.length,
    });

  } catch (error: any) {
    // Table might not exist yet
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        entries: [],
        count: 0,
      });
    }

    console.error('Error fetching mileage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mileage', details: error.message },
      { status: 500 }
    );
  }
}
