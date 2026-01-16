import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authorization
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

    // Get linked expenses
    let expenses: any[] = [];
    try {
      const expensesResult = await pool.query(`
        SELECT id, date, category, description, supplier, amount::numeric, vat::numeric
        FROM business_expenses
        WHERE invoice_id = $1
        ORDER BY date DESC
      `, [invoiceId]);
      expenses = expensesResult.rows;
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

    // Get linked receipts
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

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalMileage = mileage.reduce((sum, m) => sum + parseFloat(m.claim_amount || 0), 0);
    const totalReceipts = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalCosts = totalExpenses + totalMileage + totalReceipts;

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
        expenses: {
          items: expenses,
          total: Math.round(totalExpenses * 100) / 100,
          count: expenses.length,
        },
        mileage: {
          items: mileage,
          total: Math.round(totalMileage * 100) / 100,
          count: mileage.length,
        },
        receipts: {
          items: receipts,
          total: Math.round(totalReceipts * 100) / 100,
          count: receipts.length,
        },
        totalCosts: Math.round(totalCosts * 100) / 100,
      },
      profit: {
        amount: Math.round(profit * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
    });

  } catch (error: any) {
    console.error('Error calculating job costs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate job costs', details: error.message },
      { status: 500 }
    );
  }
}
