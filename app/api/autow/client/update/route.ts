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
      id,
      name,
      email,
      address,
      phone,
      mobile,
      vehicle_reg,
      vehicle_make,
      vehicle_model,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE clients SET
        name = $1,
        email = $2,
        address = $3,
        phone = $4,
        mobile = $5,
        vehicle_reg = $6,
        vehicle_make = $7,
        vehicle_model = $8,
        notes = $9,
        updated_at = NOW()
      WHERE id = $10
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
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client', details: error.message },
      { status: 500 }
    );
  }
}
