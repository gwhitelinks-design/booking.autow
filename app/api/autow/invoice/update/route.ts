import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, line_items = [], ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Build update query
      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        'client_name', 'client_email', 'client_address', 'client_phone',
        'client_mobile', 'client_fax', 'vehicle_make', 'vehicle_model',
        'vehicle_reg', 'notes', 'due_date', 'vat_rate', 'status',
        'payment_method', 'payment_date', 'payment_reference', 'signature_data'
      ];

      for (const field of allowedFields) {
        if (updateFields[field] !== undefined) {
          fields.push(`${field} = $${paramCount}`);
          values.push(updateFields[field]);
          paramCount++;
        }
      }

      if (fields.length > 0) {
        values.push(id);
        await client.query(
          `UPDATE invoices SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
          values
        );
      }

      // Update line items if provided
      if (line_items.length > 0) {
        await client.query(
          'DELETE FROM line_items WHERE document_type = $1 AND document_id = $2',
          ['invoice', id]
        );

        for (let i = 0; i < line_items.length; i++) {
          const item = line_items[i];
          await client.query(
            `INSERT INTO line_items (document_type, document_id, description, item_type, rate, quantity, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ['invoice', id, item.description, item.item_type || 'service', item.rate, item.quantity, i]
          );
        }

        await client.query('SELECT recalculate_invoice_totals($1)', [id]);
      }

      const invoiceResult = await client.query('SELECT * FROM invoices WHERE id = $1', [id]);
      const lineItemsResult = await client.query(
        `SELECT * FROM line_items WHERE document_type = 'invoice' AND document_id = $1 ORDER BY sort_order`,
        [id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Invoice updated successfully',
        invoice: { ...invoiceResult.rows[0], line_items: lineItemsResult.rows }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice', details: error.message }, { status: 500 });
  }
}
