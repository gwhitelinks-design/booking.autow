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
    const category = searchParams.get('category');

    let query = 'SELECT * FROM business_expenses';
    const params: string[] = [];

    if (category && category !== 'all') {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY date DESC, id DESC';

    const result = await pool.query(query, params);

    // Calculate totals
    let totalAmount = 0;
    let totalVat = 0;
    let totalDeductible = 0;

    result.rows.forEach((row: any) => {
      const amount = parseFloat(row.amount) || 0;
      const vat = parseFloat(row.vat) || 0;
      const deductiblePercent = row.tax_deductible_percent || 100;
      const allowable = row.allowable_for_tax !== false;

      totalAmount += amount;
      totalVat += vat;
      if (allowable) {
        totalDeductible += amount * (deductiblePercent / 100);
      }
    });

    return NextResponse.json({
      entries: result.rows,
      count: result.rows.length,
      totals: {
        amount: Math.round(totalAmount * 100) / 100,
        vat: Math.round(totalVat * 100) / 100,
        deductible: Math.round(totalDeductible * 100) / 100,
      },
    });

  } catch (error: any) {
    // Table might not exist yet
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        entries: [],
        count: 0,
        totals: { amount: 0, vat: 0, deductible: 0 },
      });
    }

    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses', details: error.message },
      { status: 500 }
    );
  }
}
