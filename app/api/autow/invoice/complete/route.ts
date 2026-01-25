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

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice details
    const invoiceResult = await pool.query(`
      SELECT id, invoice_number, client_name, vehicle_reg,
             subtotal::numeric, vat_amount::numeric, total::numeric, status
      FROM invoices
      WHERE id = $1
    `, [invoiceId]);

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0];

    // Only allow completing paid invoices
    if (invoice.status !== 'paid') {
      return NextResponse.json(
        { error: 'Invoice must be paid before marking as complete' },
        { status: 400 }
      );
    }

    // Get linked receipts (parts costs)
    let receipts: any[] = [];
    try {
      const receiptsResult = await pool.query(`
        SELECT id, receipt_number, receipt_date, supplier, description, amount::numeric, category
        FROM receipts
        WHERE invoice_id = $1
        ORDER BY receipt_date DESC
      `, [invoiceId]);
      receipts = receiptsResult.rows;
    } catch (e) {
      // Table may not have invoice_id column yet
    }

    // Get linked mileage
    let mileage: any[] = [];
    try {
      const mileageResult = await pool.query(`
        SELECT id, date, start_location, destination, miles::numeric, claim_amount::numeric
        FROM business_mileage
        WHERE invoice_id = $1
        ORDER BY date DESC
      `, [invoiceId]);
      mileage = mileageResult.rows;
    } catch (e) {
      // Table may not have invoice_id column yet
    }

    // Calculate costs
    const partsTotal = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const mileageTotal = mileage.reduce((sum, m) => sum + parseFloat(m.claim_amount || 0), 0);
    const totalCosts = partsTotal + mileageTotal;

    // Calculate profit
    const invoiceNet = parseFloat(invoice.total || 0) - parseFloat(invoice.vat_amount || 0);
    const profit = invoiceNet - totalCosts;
    const profitMargin = invoiceNet > 0 ? (profit / invoiceNet) * 100 : 0;

    // Update invoice with completion data
    const updateResult = await pool.query(`
      UPDATE invoices
      SET status = 'completed',
          job_completed_at = NOW(),
          parts_cost = $1,
          mileage_cost = $2,
          profit = $3,
          profit_margin = $4
      WHERE id = $5
      RETURNING *
    `, [
      Math.round(partsTotal * 100) / 100,
      Math.round(mileageTotal * 100) / 100,
      Math.round(profit * 100) / 100,
      Math.round(profitMargin * 100) / 100,
      invoiceId
    ]);

    return NextResponse.json({
      message: 'Job marked as complete',
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        vehicle_reg: invoice.vehicle_reg,
        total: parseFloat(invoice.total || 0),
        vat: parseFloat(invoice.vat_amount || 0),
        net: invoiceNet,
      },
      costs: {
        parts: {
          total: Math.round(partsTotal * 100) / 100,
          count: receipts.length,
          items: receipts,
        },
        mileage: {
          total: Math.round(mileageTotal * 100) / 100,
          count: mileage.length,
          items: mileage,
        },
        totalCosts: Math.round(totalCosts * 100) / 100,
      },
      profit: {
        amount: Math.round(profit * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
    });

  } catch (error: any) {
    console.error('Error completing job:', error);
    return NextResponse.json(
      { error: 'Failed to complete job', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to preview job costs before completing
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Get invoice details
    const invoiceResult = await pool.query(`
      SELECT id, invoice_number, client_name, vehicle_reg,
             subtotal::numeric, vat_amount::numeric, total::numeric, status
      FROM invoices
      WHERE id = $1
    `, [invoiceId]);

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0];

    // Get linked receipts (parts costs)
    let receipts: any[] = [];
    try {
      const receiptsResult = await pool.query(`
        SELECT id, receipt_number, receipt_date, supplier, description, amount::numeric, category
        FROM receipts
        WHERE invoice_id = $1
        ORDER BY receipt_date DESC
      `, [invoiceId]);
      receipts = receiptsResult.rows;
    } catch (e) {
      // ignore
    }

    // Get linked mileage
    let mileage: any[] = [];
    try {
      const mileageResult = await pool.query(`
        SELECT id, date, start_location, destination, miles::numeric, claim_amount::numeric
        FROM business_mileage
        WHERE invoice_id = $1
        ORDER BY date DESC
      `, [invoiceId]);
      mileage = mileageResult.rows;
    } catch (e) {
      // ignore
    }

    // Calculate costs
    const partsTotal = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const mileageTotal = mileage.reduce((sum, m) => sum + parseFloat(m.claim_amount || 0), 0);
    const totalCosts = partsTotal + mileageTotal;

    // Calculate profit
    const invoiceNet = parseFloat(invoice.total || 0) - parseFloat(invoice.vat_amount || 0);
    const profit = invoiceNet - totalCosts;
    const profitMargin = invoiceNet > 0 ? (profit / invoiceNet) * 100 : 0;

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        vehicle_reg: invoice.vehicle_reg,
        total: parseFloat(invoice.total || 0),
        vat: parseFloat(invoice.vat_amount || 0),
        net: invoiceNet,
        status: invoice.status,
      },
      costs: {
        parts: {
          total: Math.round(partsTotal * 100) / 100,
          count: receipts.length,
          items: receipts,
        },
        mileage: {
          total: Math.round(mileageTotal * 100) / 100,
          count: mileage.length,
          items: mileage,
        },
        totalCosts: Math.round(totalCosts * 100) / 100,
      },
      profit: {
        amount: Math.round(profit * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
    });

  } catch (error: any) {
    console.error('Error previewing job costs:', error);
    return NextResponse.json(
      { error: 'Failed to preview job costs', details: error.message },
      { status: 500 }
    );
  }
}
