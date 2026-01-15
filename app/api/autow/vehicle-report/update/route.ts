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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Build dynamic update query
    const allowedFields = [
      'service_type', 'vehicle_reg', 'vehicle_type_model', 'vehicle_weight',
      'pickup_location', 'delivery_location', 'report_date', 'time_arrival',
      'time_depart', 'customer_name', 'customer_address', 'customer_phone',
      'customer_email', 'known_issues', 'risk_procedure_description',
      'risk_procedure_signature', 'damage_markers', 'notes', 'video_file_code',
      'customer_signature', 'customer_signature_date', 'driver_signature',
      'driver_signature_date', 'status', 'booking_id'
    ];

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        // Handle JSON fields
        if (field === 'damage_markers') {
          values.push(JSON.stringify(updates[field]));
        } else {
          values.push(updates[field]);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at
    setClauses.push(`updated_at = NOW()`);

    values.push(id);

    const result = await pool.query(
      `UPDATE vehicle_reports SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Vehicle report updated successfully',
      report: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating vehicle report:', error);
    return NextResponse.json({ error: 'Failed to update vehicle report', details: error.message }, { status: 500 });
  }
}
