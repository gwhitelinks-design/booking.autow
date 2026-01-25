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
      due_date,
      vat_rate = 20.00,
      estimate_id,
      booking_id,
      line_items = []
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

      // Generate invoice number (per-vehicle sequence)
      const numberResult = await client.query(
        'SELECT * FROM generate_invoice_number($1)',
        [vehicle_reg || null]
      );
      const invoice_number = numberResult.rows[0].invoice_number;
      const sequence_number = numberResult.rows[0].sequence_num;

      // Get created_by from request or default to 'Admin'
      const created_by = body.created_by || 'Admin';

      // Insert invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number, sequence_number, client_name, client_email, client_address,
          client_phone, client_mobile, client_fax,
          vehicle_make, vehicle_model, vehicle_reg,
          notes, due_date, vat_rate, estimate_id, booking_id, created_by, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending'
        ) RETURNING *`,
        [
          invoice_number, sequence_number, client_name, client_email, client_address,
          client_phone, client_mobile, client_fax,
          vehicle_make, vehicle_model, vehicle_reg,
          notes, due_date, vat_rate, estimate_id, booking_id, created_by
        ]
      );

      const invoice = invoiceResult.rows[0];

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
            'invoice',
            invoice.id,
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
      await client.query('SELECT recalculate_invoice_totals($1)', [invoice.id]);

      // Get updated invoice with totals
      const updatedResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoice.id]
      );

      await client.query('COMMIT');

      const finalInvoice = {
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
        created_by: 'Invoice'
      }).catch(err => console.error('Auto-add client failed:', err));

      return NextResponse.json({
        message: 'Invoice created successfully',
        invoice: finalInvoice
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    );
  }
}
