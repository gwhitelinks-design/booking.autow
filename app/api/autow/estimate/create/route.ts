import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { autoAddClient } from '@/lib/auto-add-client';

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
      client_name,
      client_email,
      client_address,
      client_phone,
      client_mobile,
      client_fax,
      vehicle_make,
      vehicle_model,
      vehicle_reg,
      notes,
      vat_rate = 20.00,
      booking_id,
      line_items = [],
      // Business details overrides
      business_name,
      business_email,
      business_address,
      business_phone,
      business_website,
      business_workshop_location
    } = body;

    // Validation
    if (!client_name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate estimate number (per-vehicle sequence)
      const numberResult = await client.query(
        'SELECT * FROM generate_estimate_number($1)',
        [vehicle_reg || null]
      );
      const estimate_number = numberResult.rows[0].estimate_number;
      const sequence_number = numberResult.rows[0].sequence_num;

      // Get created_by from request or default to 'Admin'
      const created_by = body.created_by || 'Admin';

      // Insert estimate
      const estimateResult = await client.query(
        `INSERT INTO estimates (
          estimate_number, sequence_number, client_name, client_email, client_address,
          client_phone, client_mobile, client_fax,
          vehicle_make, vehicle_model, vehicle_reg,
          notes, vat_rate, booking_id, created_by, status,
          business_name, business_email, business_address, business_phone,
          business_website, business_workshop_location
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft',
          $16, $17, $18, $19, $20, $21
        ) RETURNING *`,
        [
          estimate_number, sequence_number, client_name, client_email, client_address,
          client_phone, client_mobile, client_fax,
          vehicle_make, vehicle_model, vehicle_reg,
          notes, vat_rate, booking_id, created_by,
          business_name || null, business_email || null, business_address || null,
          business_phone || null, business_website || null, business_workshop_location || null
        ]
      );

      const estimate = estimateResult.rows[0];

      // Insert line items
      const insertedLineItems = [];
      for (let i = 0; i < line_items.length; i++) {
        const item = line_items[i];
        const lineItemResult = await client.query(
          `INSERT INTO line_items (
            document_type, document_id, description, item_type,
            rate, quantity, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            'estimate',
            estimate.id,
            item.description,
            item.item_type || 'service',
            item.rate,
            item.quantity,
            i
          ]
        );
        insertedLineItems.push(lineItemResult.rows[0]);
      }

      // Recalculate totals
      await client.query('SELECT recalculate_estimate_totals($1)', [estimate.id]);

      // Get updated estimate with totals
      const updatedResult = await client.query(
        'SELECT * FROM estimates WHERE id = $1',
        [estimate.id]
      );

      await client.query('COMMIT');

      const finalEstimate = {
        ...updatedResult.rows[0],
        line_items: insertedLineItems
      };

      // Auto-add client to clients table (non-blocking)
      autoAddClient({
        name: client_name,
        email: client_email,
        address: client_address,
        phone: client_phone,
        mobile: client_mobile,
        vehicle_reg: vehicle_reg,
        vehicle_make: vehicle_make,
        vehicle_model: vehicle_model,
        created_by: 'Estimate'
      }).catch(err => console.error('Auto-add client failed:', err));

      return NextResponse.json({
        message: 'Estimate created successfully',
        estimate: finalEstimate
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create estimate', details: error.message },
      { status: 500 }
    );
  }
}
