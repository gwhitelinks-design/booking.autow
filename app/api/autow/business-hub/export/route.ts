import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  generateMileageCSV,
  generateExpensesCSV,
  generateTaxSummaryCSV,
  getExportFilename,
  getCSVHeaders,
  MileageEntry,
  MileageSummary,
  ExpenseEntry,
  ExpensesTotals,
  TaxSummaryData,
} from '@/lib/export-helper';
import { generatePdfFromUrl } from '@/lib/pdf-generator';

export const dynamic = 'force-dynamic';

const HMRC_RATES = {
  FIRST_10K: 0.45,
  AFTER_10K: 0.25,
  THRESHOLD: 10000,
};

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // mileage, expenses, tax-summary
    const format = searchParams.get('format') || 'csv'; // csv, pdf
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'year'; // for tax-summary

    if (!type) {
      return NextResponse.json({ error: 'Export type is required' }, { status: 400 });
    }

    switch (type) {
      case 'mileage':
        return await exportMileage(startDate, endDate, format);

      case 'expenses':
        return await exportExpenses(startDate, endDate, format);

      case 'tax-summary':
        return await exportTaxSummary(period, startDate, endDate, format);

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// MILEAGE EXPORT
// =============================================================================

async function exportMileage(startDate: string | null, endDate: string | null, format: string) {
  let query = 'SELECT * FROM business_mileage';
  const params: string[] = [];

  if (startDate && endDate) {
    query += ' WHERE date >= $1 AND date <= $2';
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ' WHERE date >= $1';
    params.push(startDate);
  } else if (endDate) {
    query += ' WHERE date <= $1';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';

  const result = await pool.query(query, params);
  const entries = result.rows as MileageEntry[];

  // Calculate summary
  const totalMiles = entries.reduce((sum, e) => sum + parseFloat(String(e.miles)), 0);
  const first10kMiles = Math.min(totalMiles, HMRC_RATES.THRESHOLD);
  const after10kMiles = Math.max(0, totalMiles - HMRC_RATES.THRESHOLD);
  const first10kClaim = first10kMiles * HMRC_RATES.FIRST_10K;
  const after10kClaim = after10kMiles * HMRC_RATES.AFTER_10K;
  const totalClaim = entries.reduce((sum, e) => sum + parseFloat(String(e.claim_amount)), 0);

  const summary: MileageSummary = {
    totalMiles,
    totalClaim,
    first10kMiles,
    after10kMiles,
    first10kClaim,
    after10kClaim,
  };

  if (format === 'csv') {
    const csv = generateMileageCSV(entries, summary);
    const filename = getExportFilename('mileage', 'csv');

    return new NextResponse(csv, {
      headers: getCSVHeaders(filename),
    });
  }

  return NextResponse.json({ error: 'PDF export not supported for mileage' }, { status: 400 });
}

// =============================================================================
// EXPENSES EXPORT
// =============================================================================

async function exportExpenses(startDate: string | null, endDate: string | null, format: string) {
  let query = 'SELECT * FROM business_expenses';
  const params: string[] = [];

  if (startDate && endDate) {
    query += ' WHERE date >= $1 AND date <= $2';
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ' WHERE date >= $1';
    params.push(startDate);
  } else if (endDate) {
    query += ' WHERE date <= $1';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';

  const result = await pool.query(query, params);
  const entries = result.rows as ExpenseEntry[];

  // Calculate totals
  const total = entries.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
  const vat = entries.reduce((sum, e) => sum + parseFloat(String(e.vat || 0)), 0);
  const taxDeductible = entries.reduce((sum, e) => {
    const amount = parseFloat(String(e.amount));
    const percent = e.tax_deductible_percent || 100;
    return sum + (amount * percent / 100);
  }, 0);

  const totals: ExpensesTotals = {
    total,
    vat,
    taxDeductible,
    count: entries.length,
  };

  if (format === 'csv') {
    const csv = generateExpensesCSV(entries, totals);
    const filename = getExportFilename('expenses', 'csv');

    return new NextResponse(csv, {
      headers: getCSVHeaders(filename),
    });
  }

  return NextResponse.json({ error: 'PDF export not supported for expenses' }, { status: 400 });
}

// =============================================================================
// TAX SUMMARY EXPORT
// =============================================================================

async function exportTaxSummary(
  period: string,
  startDate: string | null,
  endDate: string | null,
  format: string
) {
  // Calculate date range
  const now = new Date();
  let periodStart: Date;
  let periodEnd = new Date();

  if (startDate && endDate) {
    periodStart = new Date(startDate);
    periodEnd = new Date(endDate);
  } else {
    switch (period) {
      case 'week':
        periodStart = new Date(now);
        const day = periodStart.getDay();
        const diff = periodStart.getDate() - day + (day === 0 ? -6 : 1);
        periodStart.setDate(diff);
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'year':
      default:
        // UK tax year starts April 6th
        if (now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6)) {
          periodStart = new Date(now.getFullYear() - 1, 3, 6);
        } else {
          periodStart = new Date(now.getFullYear(), 3, 6);
        }
        break;
    }
  }

  const startDateStr = periodStart.toISOString().split('T')[0];
  const endDateStr = periodEnd.toISOString().split('T')[0];

  // Fetch invoices
  const invoicesResult = await pool.query(`
    SELECT
      id, invoice_number, invoice_date, paid_at, client_name, vehicle_reg,
      subtotal::numeric, vat_amount::numeric, total::numeric
    FROM invoices
    WHERE status = 'paid'
      AND COALESCE(paid_at, invoice_date)::date >= $1
      AND COALESCE(paid_at, invoice_date)::date <= $2
  `, [startDateStr, endDateStr]);

  // Fetch expenses
  let expensesResult = { rows: [] as any[] };
  try {
    expensesResult = await pool.query(`
      SELECT
        id, date, category, subcategory, description, supplier,
        amount::numeric, vat::numeric, tax_deductible_percent
      FROM business_expenses
      WHERE date >= $1 AND date <= $2
    `, [startDateStr, endDateStr]);
  } catch (e: any) {
    if (!e.message?.includes('does not exist')) {
      console.error('Expenses query error:', e);
    }
  }

  // Fetch mileage
  let mileageResult = { rows: [] as any[] };
  try {
    mileageResult = await pool.query(`
      SELECT
        id, date, description, start_postcode, end_postcode,
        miles::numeric, claim_amount::numeric
      FROM business_mileage
      WHERE date >= $1 AND date <= $2
    `, [startDateStr, endDateStr]);
  } catch (e: any) {
    if (!e.message?.includes('does not exist')) {
      console.error('Mileage query error:', e);
    }
  }

  const invoices = invoicesResult.rows;
  const expenses = expensesResult.rows;
  const mileage = mileageResult.rows;

  // Calculate totals
  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
  const totalVatCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.vat_amount || 0), 0);
  const netRevenue = totalRevenue - totalVatCollected;

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalExpenseVat = expenses.reduce((sum, exp) => sum + parseFloat(exp.vat || 0), 0);
  const taxDeductibleExpenses = expenses.reduce((sum, exp) => {
    const amount = parseFloat(exp.amount || 0);
    const percent = exp.tax_deductible_percent || 100;
    return sum + (amount * percent / 100);
  }, 0);

  const totalMiles = mileage.reduce((sum, m) => sum + parseFloat(m.miles || 0), 0);
  const totalMileageClaim = mileage.reduce((sum, m) => sum + parseFloat(m.claim_amount || 0), 0);

  const totalDeductions = taxDeductibleExpenses + totalMileageClaim;
  const grossProfit = netRevenue - totalDeductions;

  // Calculate tax
  const periodMultiplier = period === 'week' ? 52 : period === 'month' ? 12 : period === 'quarter' ? 4 : 1;
  const annualizedProfit = grossProfit * periodMultiplier;

  let taxRate: number;
  let taxBracket: string;
  let annualTax: number;

  if (annualizedProfit <= 0) {
    taxRate = 0;
    taxBracket = 'No Profit';
    annualTax = 0;
  } else if (annualizedProfit <= 50000) {
    taxRate = 19;
    taxBracket = 'Small Profits Rate (19%)';
    annualTax = annualizedProfit * 0.19;
  } else if (annualizedProfit <= 250000) {
    const mainTax = annualizedProfit * 0.25;
    const marginalRelief = ((250000 - annualizedProfit) * 3) / 200;
    annualTax = mainTax - marginalRelief;
    taxRate = Math.round((annualTax / annualizedProfit) * 1000) / 10;
    taxBracket = `Marginal Relief (${taxRate.toFixed(1)}%)`;
  } else {
    taxRate = 25;
    taxBracket = 'Main Rate (25%)';
    annualTax = annualizedProfit * 0.25;
  }

  const estimatedTax = grossProfit > 0 ? annualTax / periodMultiplier : 0;
  const takeHome = grossProfit - estimatedTax;

  // Group expenses by category
  const byCategory = expenses.reduce((acc, exp) => {
    const category = exp.category || 'Other';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, taxDeductible: 0 };
    }
    const amount = parseFloat(exp.amount || 0);
    acc[category].total += amount;
    acc[category].count += 1;
    acc[category].taxDeductible += amount * (exp.tax_deductible_percent || 100) / 100;
    return acc;
  }, {} as Record<string, { total: number; count: number; taxDeductible: number }>);

  const taxSummaryData: TaxSummaryData = {
    period,
    dateRange: { start: startDateStr, end: endDateStr },
    revenue: {
      total: Math.round(totalRevenue * 100) / 100,
      vatCollected: Math.round(totalVatCollected * 100) / 100,
      net: Math.round(netRevenue * 100) / 100,
      invoiceCount: invoices.length,
    },
    expenses: {
      total: Math.round(totalExpenses * 100) / 100,
      vatPaid: Math.round(totalExpenseVat * 100) / 100,
      taxDeductible: Math.round(taxDeductibleExpenses * 100) / 100,
      count: expenses.length,
      byCategory,
    },
    mileage: {
      totalMiles: Math.round(totalMiles * 100) / 100,
      claimAmount: Math.round(totalMileageClaim * 100) / 100,
      count: mileage.length,
    },
    tax: {
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      annualizedProfit: Math.round(annualizedProfit * 100) / 100,
      taxRate,
      taxBracket,
      estimatedTax: Math.round(estimatedTax * 100) / 100,
      takeHome: Math.round(takeHome * 100) / 100,
      holdBack: Math.round(estimatedTax * 100) / 100,
    },
    vat: {
      collected: Math.round(totalVatCollected * 100) / 100,
      paid: Math.round(totalExpenseVat * 100) / 100,
      liability: Math.round((totalVatCollected - totalExpenseVat) * 100) / 100,
    },
  };

  if (format === 'csv') {
    const csv = generateTaxSummaryCSV(taxSummaryData);
    const filename = getExportFilename('tax-summary', 'csv');

    return new NextResponse(csv, {
      headers: getCSVHeaders(filename),
    });
  } else if (format === 'pdf') {
    // Generate PDF using share page
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/share/tax-summary?period=${period}&startDate=${startDateStr}&endDate=${endDateStr}&token=${process.env.AUTOW_STAFF_TOKEN}`;

      const pdfBuffer = await generatePdfFromUrl(shareUrl);
      const filename = getExportFilename('tax-summary', 'pdf');

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (pdfError: any) {
      console.error('PDF generation error:', pdfError);
      return NextResponse.json(
        { error: 'PDF generation failed', details: pdfError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
