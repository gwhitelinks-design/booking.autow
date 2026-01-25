import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify auth token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.AUTOW_STAFF_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const vehicleReg = searchParams.get('vehicle_reg')?.trim().toUpperCase();

    if (!vehicleReg) {
      return NextResponse.json({ client: null });
    }

    const client = await pool.connect();

    try {
      // Search clients table first
      let result = await client.query(
        `SELECT * FROM clients
         WHERE UPPER(REPLACE(vehicle_reg, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
         ORDER BY updated_at DESC NULLS LAST
         LIMIT 1`,
        [vehicleReg]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({
          client: result.rows[0],
          source: 'clients'
        });
      }

      // If not found in clients, search invoices
      result = await client.query(
        `SELECT
          client_name as name,
          client_email as email,
          client_address as address,
          client_phone as phone,
          client_mobile as mobile,
          vehicle_reg,
          vehicle_make,
          vehicle_model
         FROM invoices
         WHERE UPPER(REPLACE(vehicle_reg, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
         ORDER BY created_at DESC
         LIMIT 1`,
        [vehicleReg]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({
          client: result.rows[0],
          source: 'invoices'
        });
      }

      // If not found in invoices, search estimates
      result = await client.query(
        `SELECT
          client_name as name,
          client_email as email,
          client_address as address,
          client_phone as phone,
          client_mobile as mobile,
          vehicle_reg,
          vehicle_make,
          vehicle_model
         FROM estimates
         WHERE UPPER(REPLACE(vehicle_reg, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
         ORDER BY created_at DESC
         LIMIT 1`,
        [vehicleReg]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({
          client: result.rows[0],
          source: 'estimates'
        });
      }

      // If not found in estimates, search vehicle_reports
      result = await client.query(
        `SELECT
          customer_name as name,
          customer_email as email,
          customer_address as address,
          customer_phone as phone,
          NULL as mobile,
          vehicle_reg,
          NULL as vehicle_make,
          vehicle_type_model as vehicle_model
         FROM vehicle_reports
         WHERE UPPER(REPLACE(vehicle_reg, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
         ORDER BY created_at DESC
         LIMIT 1`,
        [vehicleReg]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({
          client: result.rows[0],
          source: 'vehicle_reports'
        });
      }

      // If not found in vehicle_reports, search bookings
      result = await client.query(
        `SELECT
          customer_name as name,
          customer_email as email,
          location_address as address,
          customer_phone as phone,
          NULL as mobile,
          vehicle_reg,
          vehicle_make,
          vehicle_model
         FROM bookings
         WHERE UPPER(REPLACE(vehicle_reg, ' ', '')) = UPPER(REPLACE($1, ' ', ''))
         ORDER BY created_at DESC
         LIMIT 1`,
        [vehicleReg]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({
          client: result.rows[0],
          source: 'bookings'
        });
      }

      // Not found anywhere
      return NextResponse.json({ client: null });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching for client by vehicle:', error);
    return NextResponse.json({ error: 'Failed to search for client' }, { status: 500 });
  }
}
