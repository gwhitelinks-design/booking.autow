import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await request.json();

    if (!report_id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check if report exists
      const reportResult = await client.query(
        'SELECT id, share_token FROM vehicle_reports WHERE id = $1',
        [report_id]
      );

      if (reportResult.rows.length === 0) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const report = reportResult.rows[0];

      // Generate new share token if one doesn't exist
      let shareToken = report.share_token;
      if (!shareToken) {
        shareToken = randomUUID();

        // Update report with new share token
        await client.query(
          'UPDATE vehicle_reports SET share_token = $1 WHERE id = $2',
          [shareToken, report_id]
        );
      }

      // Build share URL
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/vehicle-report/${shareToken}`;

      return NextResponse.json({
        success: true,
        share_token: shareToken,
        share_url: shareUrl
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 });
  }
}
