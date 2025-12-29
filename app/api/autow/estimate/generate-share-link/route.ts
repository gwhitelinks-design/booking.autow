import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[Share Link] Starting share link generation');

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('[Share Link] No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = verifyToken(token);
    if (!userData) {
      console.log('[Share Link] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[Share Link] Logged in user:', userData);

    const { estimate_id } = await request.json();
    console.log('[Share Link] Request for estimate_id:', estimate_id);

    if (!estimate_id) {
      return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 });
    }

    console.log('[Share Link] Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('[Share Link] Querying estimate...');
      // Check if estimate exists and belongs to user
      const estimateResult = await client.query(
        'SELECT id, user_id, vehicle_reg FROM estimates WHERE id = $1',
        [estimate_id]
      );

      console.log('[Share Link] Query result:', estimateResult.rows);

      if (estimateResult.rows.length === 0) {
        console.log('[Share Link] Estimate not found');
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }

      const estimate = estimateResult.rows[0];
      console.log('[Share Link] Estimate found:', { id: estimate.id, vehicle_reg: estimate.vehicle_reg });

      // Skip user_id check for single-user system
      // if (estimate.user_id !== userData.userId) {
      //   console.log('[Share Link] User mismatch');
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      // }

      // Check if estimate has a vehicle_reg
      if (!estimate.vehicle_reg) {
        console.log('[Share Link] No vehicle registration');
        return NextResponse.json({
          error: 'This estimate does not have a vehicle registration. Please edit the estimate and add a vehicle registration first.'
        }, { status: 400 });
      }

      // Use vehicle_reg as the share identifier
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/estimate/${encodeURIComponent(estimate.vehicle_reg)}`;

      console.log('[Share Link] Success! URL:', shareUrl);

      return NextResponse.json({
        success: true,
        vehicle_reg: estimate.vehicle_reg,
        share_url: shareUrl
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Share Link] ERROR:', error);
    console.error('[Share Link] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      error: 'Failed to generate share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
