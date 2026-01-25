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

    const { estimate_id } = await request.json();

    if (!estimate_id) {
      return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get estimate
      const estimateResult = await client.query(
        'SELECT * FROM estimates WHERE id = $1',
        [estimate_id]
      );

      if (estimateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }

      const estimate = estimateResult.rows[0];

      // Check if already converted
      if (estimate.status === 'converted') {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Estimate already converted to invoice' }, { status: 400 });
      }

      // Generate invoice number (per-vehicle sequence)
      const numberResult = await client.query(
        'SELECT * FROM generate_invoice_number($1)',
        [estimate.vehicle_reg || null]
      );
      const invoice_number = numberResult.rows[0].invoice_number;
      const sequence_number = numberResult.rows[0].sequence_num;

      // Create invoice from estimate
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number, sequence_number, client_name, client_email, client_address,
          client_phone, client_mobile, client_fax,
          vehicle_make, vehicle_model, vehicle_reg,
          notes, vat_rate, estimate_id, booking_id, created_by,
          subtotal, vat_amount, total, balance_due, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $19, 'pending'
        ) RETURNING *`,
        [
          invoice_number,
          sequence_number,
          estimate.client_name,
          estimate.client_email,
          estimate.client_address,
          estimate.client_phone,
          estimate.client_mobile,
          estimate.client_fax,
          estimate.vehicle_make,
          estimate.vehicle_model,
          estimate.vehicle_reg,
          estimate.notes,
          estimate.vat_rate,
          estimate_id,
          estimate.booking_id,
          estimate.created_by,
          estimate.subtotal,
          estimate.vat_amount,
          estimate.total
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Copy line items from estimate to invoice
      const lineItemsResult = await client.query(
        `SELECT * FROM line_items
         WHERE document_type = 'estimate' AND document_id = $1
         ORDER BY sort_order`,
        [estimate_id]
      );

      for (const item of lineItemsResult.rows) {
        await client.query(
          `INSERT INTO line_items (
            document_type, document_id, description, item_type,
            rate, quantity, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'invoice',
            invoice.id,
            item.description,
            item.item_type,
            item.rate,
            item.quantity,
            item.sort_order
          ]
        );
      }

      // Update estimate status and link to invoice
      await client.query(
        `UPDATE estimates
         SET status = 'converted', invoice_id = $1, accepted_at = NOW()
         WHERE id = $2`,
        [invoice.id, estimate_id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Estimate converted to invoice successfully',
        invoice
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error converting estimate to invoice:', error);
    return NextResponse.json(
      { error: 'Failed to convert estimate', details: error.message },
      { status: 500 }
    );
  }
}
