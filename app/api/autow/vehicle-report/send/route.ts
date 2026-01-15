import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendVehicleReportEmail } from '@/lib/autow-email';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, customerEmail, customMessage } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Get the report details
    const result = await pool.query(
      'SELECT * FROM vehicle_reports WHERE id = $1',
      [reportId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = result.rows[0];

    // Generate share token if one doesn't exist
    let shareToken = report.share_token;
    if (!shareToken) {
      shareToken = randomUUID();
      await pool.query(
        'UPDATE vehicle_reports SET share_token = $1 WHERE id = $2',
        [shareToken, reportId]
      );
    }

    // Build the public share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk';
    const reportUrl = `${baseUrl}/share/vehicle-report/${shareToken}`;

    // Format the date
    const reportDate = report.report_date
      ? new Date(report.report_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Not specified';

    // Send the email
    const emailResult = await sendVehicleReportEmail({
      customerName: report.customer_name || 'Valued Customer',
      customerEmail: customerEmail,
      vehicleReg: report.vehicle_reg,
      vehicleType: report.vehicle_type_model,
      serviceType: report.service_type || 'transport',
      reportNumber: report.report_number,
      reportDate: reportDate,
      pickupLocation: report.pickup_location,
      deliveryLocation: report.delivery_location,
      reportUrl: reportUrl,
      customMessage: customMessage
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update report to record that email was sent
    await pool.query(
      `UPDATE vehicle_reports SET
        email_sent_at = NOW(),
        email_sent_to = $1,
        updated_at = NOW()
      WHERE id = $2`,
      [customerEmail, reportId]
    );

    return NextResponse.json({
      message: 'Vehicle report sent successfully',
      sentTo: customerEmail
    });

  } catch (error: any) {
    console.error('Error sending vehicle report:', error);
    return NextResponse.json(
      { error: 'Failed to send vehicle report', details: error.message },
      { status: 500 }
    );
  }
}
