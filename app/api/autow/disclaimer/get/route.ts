import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Disclaimer ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM disclaimers WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Disclaimer not found' }, { status: 404 });
      }

      const disclaimer = result.rows[0];

      // Add share URL
      disclaimer.share_url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/disclaimer/${disclaimer.share_token}`;

      return NextResponse.json({ disclaimer });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error getting disclaimer:', error);
    return NextResponse.json({ error: 'Failed to get disclaimer' }, { status: 500 });
  }
}
