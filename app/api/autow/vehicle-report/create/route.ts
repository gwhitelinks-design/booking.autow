import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      service_type,
      vehicle_reg,
      vehicle_type_model,
      vehicle_weight,
      pickup_location,
      delivery_location,
      report_date,
      time_arrival,
      time_depart,
      customer_name,
      customer_address,
      customer_phone,
      customer_email,
      known_issues,
      risk_procedure_description,
      risk_procedure_signature,
      damage_markers,
      notes,
      video_file_code,
      customer_signature,
      customer_signature_date,
      driver_signature,
      driver_signature_date,
      status,
      booking_id,
      created_by = 'Staff'
    } = body;

    // Validate required fields
    if (!service_type) {
      return NextResponse.json({ error: 'Service type is required' }, { status: 400 });
    }
    if (!vehicle_reg) {
      return NextResponse.json({ error: 'Vehicle registration is required' }, { status: 400 });
    }
    if (!customer_name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    // Generate report number
    const numberResult = await pool.query('SELECT generate_report_number() as report_number');
    const report_number = numberResult.rows[0].report_number;

    // Insert report
    const result = await pool.query(
      `INSERT INTO vehicle_reports (
        report_number, report_date, service_type, vehicle_reg, vehicle_type_model,
        vehicle_weight, pickup_location, delivery_location, time_arrival, time_depart,
        customer_name, customer_address, customer_phone, customer_email, known_issues,
        risk_procedure_description, risk_procedure_signature, damage_markers, notes,
        video_file_code, customer_signature, customer_signature_date, driver_signature,
        driver_signature_date, status, booking_id, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *`,
      [
        report_number,
        report_date || new Date().toISOString().split('T')[0],
        service_type,
        vehicle_reg,
        vehicle_type_model || null,
        vehicle_weight || null,
        pickup_location || null,
        delivery_location || null,
        time_arrival || null,
        time_depart || null,
        customer_name,
        customer_address || null,
        customer_phone || null,
        customer_email || null,
        known_issues || null,
        risk_procedure_description || null,
        risk_procedure_signature || null,
        JSON.stringify(damage_markers || []),
        notes || null,
        video_file_code || null,
        customer_signature || null,
        customer_signature_date || null,
        driver_signature || null,
        driver_signature_date || null,
        status || 'draft',
        booking_id || null,
        created_by
      ]
    );

    return NextResponse.json({
      message: 'Vehicle report created successfully',
      report: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating vehicle report:', error);
    return NextResponse.json({ error: 'Failed to create vehicle report', details: error.message }, { status: 500 });
  }
}
