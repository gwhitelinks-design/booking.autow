import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendShareLinkNotification } from '@/lib/telegram';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Find damage assessment by share_token
      const result = await client.query(
        `SELECT * FROM damage_assessments WHERE share_token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Assessment not found or link expired' }, { status: 404 });
      }

      const assessment = result.rows[0];

      // Get business settings
      let businessSettings = null;
      try {
        const settingsResult = await client.query(
          'SELECT * FROM business_settings LIMIT 1'
        );
        businessSettings = settingsResult.rows[0] || null;
      } catch (settingsError) {
        console.error('Business settings query failed:', settingsError);
      }

      // Send Telegram notification (non-blocking)
      // Create a notification object similar to invoice/estimate
      const notificationData = {
        vehicle_reg: assessment.vehicle_reg,
        vehicle_make: assessment.vehicle_make,
        vehicle_model: assessment.vehicle_model,
        assessment_date: assessment.assessment_date,
        recommendation: assessment.recommendation,
        repair_cost_min: assessment.repair_cost_min,
        repair_cost_max: assessment.repair_cost_max,
      };

      sendShareLinkNotification('assessment', notificationData).catch(err =>
        console.error('Telegram notification failed:', err)
      );

      return NextResponse.json({
        assessment,
        business_settings: businessSettings
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching shared assessment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({
      error: 'Failed to load assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
