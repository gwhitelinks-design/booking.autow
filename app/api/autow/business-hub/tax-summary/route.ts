import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date range based on period
    const now = new Date();
    let periodStart: Date;
    let periodEnd = new Date();

    if (startDateParam && endDateParam) {
      periodStart = new Date(startDateParam);
      periodEnd = new Date(endDateParam);
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
          // UK tax year starts April 6th
          if (now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6)) {
            periodStart = new Date(now.getFullYear() - 1, 3, 6);
          } else {
            periodStart = new Date(now.getFullYear(), 3, 6);
          }
          break;
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    const startDateStr = periodStart.toISOString().split('T')[0];
    const endDateStr = periodEnd.toISOString().split('T')[0];

    // Fetch paid invoices (revenue)
    const invoicesResult = await pool.query(`
      SELECT
        id, invoice_number, invoice_date, paid_at, client_name, vehicle_reg,
        subtotal::numeric, vat_amount::numeric, total::numeric, payment_method
      FROM invoices
      WHERE status = 'paid'
        AND COALESCE(paid_at, invoice_date)::date >= $1
        AND COALESCE(paid_at, invoice_date)::date <= $2
      ORDER BY COALESCE(paid_at, invoice_date) DESC
    `, [startDateStr, endDateStr]);

    // Fetch expenses (deductions) - use business_expenses table
    let expensesResult = { rows: [] as any[] };
    try {
      expensesResult = await pool.query(`
        SELECT
          id, date, category, subcategory, description, supplier,
          amount::numeric, vat::numeric, tax_deductible_percent, allowable_for_tax
        FROM business_expenses
        WHERE date >= $1 AND date <= $2
        ORDER BY date DESC
      `, [startDateStr, endDateStr]);
    } catch (e: any) {
      if (!e.message?.includes('does not exist')) {
        console.error('Expenses query error:', e);
      }
    }

    // Fetch mileage claims - use business_mileage table
    let mileageResult = { rows: [] as any[] };
    try {
      mileageResult = await pool.query(`
        SELECT
          id, date, description, start_postcode, end_postcode,
          miles::numeric, claim_amount::numeric
        FROM business_mileage
        WHERE date >= $1 AND date <= $2
        ORDER BY date DESC
      `, [startDateStr, endDateStr]);
    } catch (e: any) {
      if (!e.message?.includes('does not exist')) {
        console.error('Mileage query error:', e);
      }
    }

    // Calculate totals
    const invoices = invoicesResult.rows;
    const expenses = expensesResult.rows;
    const mileage = mileageResult.rows;

    // Revenue calculations
    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const totalVatCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.vat_amount || 0), 0);
    const netRevenue = totalRevenue - totalVatCollected;

    // Expense calculations (tax deductible portion)
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const totalExpenseVat = expenses.reduce((sum, exp) => sum + parseFloat(exp.vat || 0), 0);
    const taxDeductibleExpenses = expenses.reduce((sum, exp) => {
      const amount = parseFloat(exp.amount || 0);
      const percent = exp.tax_deductible_percent || 100;
      const allowable = exp.allowable_for_tax !== false;
      return allowable ? sum + (amount * percent / 100) : sum;
    }, 0);

    // Mileage calculations
    const totalMiles = mileage.reduce((sum, m) => sum + parseFloat(m.miles || 0), 0);
    const totalMileageClaim = mileage.reduce((sum, m) => sum + parseFloat(m.claim_amount || 0), 0);

    // Profit calculation
    const totalDeductions = taxDeductibleExpenses + totalMileageClaim;
    const grossProfit = netRevenue - totalDeductions;

    // Corporation tax calculation using HMRC 2025/26 rates
    const periodMultiplier = period === 'week' ? 52 : period === 'month' ? 12 : period === 'quarter' ? 4 : 1;
    const annualizedProfit = grossProfit * periodMultiplier;

    // Calculate corporation tax using proper Marginal Relief formula
    const { tax: annualTax, rate: taxRate, bracket: taxBracket } = calculateCorporationTax(annualizedProfit);

    // Scale tax back to period
    const estimatedTax = grossProfit > 0 ? annualTax / periodMultiplier : 0;
    const takeHome = grossProfit - estimatedTax;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, taxDeductible: 0 };
      }
      const amount = parseFloat(exp.amount || 0);
      acc[category].total += amount;
      acc[category].count += 1;
      acc[category].taxDeductible += amount * (exp.tax_deductible_percent || 100) / 100;
      return acc;
    }, {} as { [key: string]: { total: number; count: number; taxDeductible: number } });

    // Calculate weekly breakdown if showing month or longer
    const weeklyBreakdown: { week: string; revenue: number; expenses: number; profit: number }[] = [];

    if (period !== 'week') {
      const weeklyData: { [key: string]: { revenue: number; expenses: number } } = {};

      invoices.forEach((inv: any) => {
        const date = new Date(inv.paid_at || inv.invoice_date);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { revenue: 0, expenses: 0 };
        }
        weeklyData[weekKey].revenue += parseFloat(inv.total || 0) - parseFloat(inv.vat_amount || 0);
      });

      expenses.forEach((exp: any) => {
        const date = new Date(exp.date);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { revenue: 0, expenses: 0 };
        }
        weeklyData[weekKey].expenses += parseFloat(exp.amount || 0) * (exp.tax_deductible_percent || 100) / 100;
      });

      mileage.forEach((m: any) => {
        const date = new Date(m.date);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { revenue: 0, expenses: 0 };
        }
        weeklyData[weekKey].expenses += parseFloat(m.claim_amount || 0);
      });

      Object.entries(weeklyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([weekKey, data]) => {
          weeklyBreakdown.push({
            week: formatWeekRange(new Date(weekKey)),
            revenue: data.revenue,
            expenses: data.expenses,
            profit: data.revenue - data.expenses
          });
        });
    }

    return NextResponse.json({
      period,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      },

      // Revenue
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        vatCollected: Math.round(totalVatCollected * 100) / 100,
        net: Math.round(netRevenue * 100) / 100,
        invoiceCount: invoices.length
      },

      // Expenses
      expenses: {
        total: Math.round(totalExpenses * 100) / 100,
        vatPaid: Math.round(totalExpenseVat * 100) / 100,
        taxDeductible: Math.round(taxDeductibleExpenses * 100) / 100,
        count: expenses.length,
        byCategory: expensesByCategory
      },

      // Mileage
      mileage: {
        totalMiles: Math.round(totalMiles * 100) / 100,
        claimAmount: Math.round(totalMileageClaim * 100) / 100,
        count: mileage.length
      },

      // Tax calculation
      tax: {
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        annualizedProfit: Math.round(annualizedProfit * 100) / 100,
        taxRate: taxRate * 100,
        taxBracket,
        estimatedTax: Math.round(estimatedTax * 100) / 100,
        takeHome: Math.round(takeHome * 100) / 100,
        holdBack: Math.round(estimatedTax * 100) / 100
      },

      // VAT summary
      vat: {
        collected: Math.round(totalVatCollected * 100) / 100,
        paid: Math.round(totalExpenseVat * 100) / 100,
        liability: Math.round((totalVatCollected - totalExpenseVat) * 100) / 100
      },

      // Breakdowns
      weeklyBreakdown,

      // Raw data for tables
      invoices,
      expensesList: expenses,
      mileageList: mileage
    });

  } catch (error: any) {
    console.error('Tax summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax summary', details: error.message },
      { status: 500 }
    );
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${format(weekStart)} - ${format(weekEnd)}`;
}

/**
 * Calculate Corporation Tax using HMRC 2025/26 rates with Marginal Relief
 *
 * Rates:
 * - £0 - £50,000: 19% (Small Profits Rate)
 * - £50,001 - £250,000: Marginal Relief applies
 * - Over £250,000: 25% (Main Rate)
 *
 * Marginal Relief Formula:
 * Tax = Profits × 25% - ((250,000 - Profits) × 3/200)
 */
function calculateCorporationTax(profit: number): { tax: number; rate: number; bracket: string } {
  if (profit <= 0) {
    return { tax: 0, rate: 0, bracket: 'No Profit' };
  }

  if (profit <= 50000) {
    // Small Profits Rate: 19%
    return {
      tax: profit * 0.19,
      rate: 19,
      bracket: 'Small Profits Rate (19%)'
    };
  } else if (profit <= 250000) {
    // Marginal Relief: Tax = Profits × 25% - ((250,000 - Profits) × 3/200)
    const mainTax = profit * 0.25;
    const marginalRelief = ((250000 - profit) * 3) / 200;
    const tax = mainTax - marginalRelief;
    const effectiveRate = (tax / profit) * 100;

    return {
      tax,
      rate: Math.round(effectiveRate * 10) / 10, // Round to 1 decimal
      bracket: `Marginal Relief (${effectiveRate.toFixed(1)}%)`
    };
  } else {
    // Main Rate: 25%
    return {
      tax: profit * 0.25,
      rate: 25,
      bracket: 'Main Rate (25%)'
    };
  }
}
