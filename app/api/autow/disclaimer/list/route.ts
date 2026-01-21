import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const client = await pool.connect();

    try {
      let query = 'SELECT * FROM disclaimers';
      const params: string[] = [];

      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, params);

      // Add share URLs to each disclaimer
      const disclaimers = result.rows.map(disclaimer => ({
        ...disclaimer,
        share_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/disclaimer/${disclaimer.share_token}`,
      }));

      return NextResponse.json({ disclaimers });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error listing disclaimers:', error);
    return NextResponse.json({ error: 'Failed to list disclaimers' }, { status: 500 });
  }
}
