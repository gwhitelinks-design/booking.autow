import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendShareLinkNotification } from '@/lib/telegram';

// Disable caching to ensure notification fires on every view
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM disclaimers WHERE share_token = $1',
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Disclaimer not found' }, { status: 404 });
      }

      const disclaimer = result.rows[0];

      // Send Telegram notification (non-blocking)
      sendShareLinkNotification('disclaimer', disclaimer).catch(err =>
        console.error('Telegram notification failed:', err)
      );

      return NextResponse.json({ disclaimer });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching disclaimer:', error);
    return NextResponse.json({ error: 'Failed to fetch disclaimer' }, { status: 500 });
  }
}
