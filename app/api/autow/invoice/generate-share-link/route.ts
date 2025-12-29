import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = verifyToken(token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { invoice_id } = await request.json();

    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check if invoice exists and belongs to user
      const invoiceResult = await client.query(
        'SELECT id, user_id, vehicle_reg FROM invoices WHERE id = $1',
        [invoice_id]
      );

      if (invoiceResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const invoice = invoiceResult.rows[0];

      // Skip user_id check for single-user system
      // if (invoice.user_id !== userData.userId) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      // }

      // Check if invoice has a vehicle_reg
      if (!invoice.vehicle_reg) {
        return NextResponse.json({
          error: 'This invoice does not have a vehicle registration. Please edit the invoice and add a vehicle registration first.'
        }, { status: 400 });
      }

      // Use vehicle_reg as the share identifier
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'}/share/invoice/${encodeURIComponent(invoice.vehicle_reg)}`;

      return NextResponse.json({
        success: true,
        vehicle_reg: invoice.vehicle_reg,
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
