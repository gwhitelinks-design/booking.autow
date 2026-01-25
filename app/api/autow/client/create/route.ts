import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      address,
      phone,
      mobile,
      vehicle_reg,
      vehicle_make,
      vehicle_model,
      notes,
      created_by = 'Admin'
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO clients (
        name, email, address, phone, mobile,
        vehicle_reg, vehicle_make, vehicle_model, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name.trim(),
        email || null,
        address || null,
        phone || null,
        mobile || null,
        vehicle_reg ? vehicle_reg.toUpperCase() : null,
        vehicle_make || null,
        vehicle_model || null,
        notes || null,
        created_by
      ]
    );

    return NextResponse.json({
      success: true,
      client: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client', details: error.message },
      { status: 500 }
    );
  }
}
