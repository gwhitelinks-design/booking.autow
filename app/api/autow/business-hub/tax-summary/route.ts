'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

interface TokenPayload {
  userId: number;
  email: string;
}

function verifyAuth(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month'; // week, month, quarter, year, custom
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const client = await pool.connect();

  try {
    // Calculate date range based on period
    let dateFilter = '';
    let dateParams: string[] = [];
    const now = new Date();

    if (startDate && endDate) {
      // Custom date range
      dateFilter = 'AND date >= $1 AND date <= $2';
      dateParams = [startDate, endDate];
    } else {
      let periodStart: Date;

      switch (period) {
        case 'week':
          // Get start of current week (Monday)
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

      dateFilter = 'AND date >= $1';
      dateParams = [periodStart.toISOString().split('T')[0]];
    }

    // Fetch paid invoices (revenue)
    const invoiceDateFilter = dateFilter.replace(/date/g, 'COALESCE(paid_at, invoice_date)::date');
    const invoicesQuery = `
      SELECT
        id, invoice_number, invoice_date, paid_at, client_name, vehicle_reg,
        subtotal::numeric, vat_amount::numeric, total::numeric, payment_method
      FROM invoices
      WHERE status = 'paid'
      ${invoiceDateFilter.replace('$1', `'${dateParams[0]}'`)}
      ${dateParams[1] ? invoiceDateFilter.replace('$2', `'${dateParams[1]}'`).split('AND')[2] : ''}
      ORDER BY COALESCE(paid_at, invoice_date) DESC
    `;
    const invoicesResult = await client.query(invoicesQuery);

    // Fetch expenses (deductions)
    const expensesQuery = `
      SELECT
        id, date, category, subcategory, description, supplier,
        amount::numeric, vat::numeric, tax_deductible_percent
      FROM expenses
      WHERE 1=1 ${dateFilter}
      ORDER BY date DESC
    `;
    const expensesResult = await client.query(expensesQuery, dateParams.slice(0, dateFilter.split('$').length - 1));

    // Fetch mileage claims
    const mileageQuery = `
      SELECT
        id, date, description, start_postcode, end_postcode,
        miles::numeric, claim_amount::numeric
      FROM mileage_entries
      WHERE 1=1 ${dateFilter}
      ORDER BY date DESC
    `;
    const mileageResult = await client.query(mileageQuery, dateParams.slice(0, dateFilter.split('$').length - 1));

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
      return sum + (amount * percent / 100);
    }, 0);

    // Mileage calculations
    const totalMiles = mileage.reduce((sum, m) => sum + parseFloat(m.miles || 0), 0);
    const totalMileageClaim = mileage.reduce((sum, m) => sum + parseFloat(m.claim_amount || 0), 0);

    // Profit calculation
    const totalDeductions = taxDeductibleExpenses + totalMileageClaim;
    const grossProfit = netRevenue - totalDeductions;

    // Corporation tax calculation
    let taxRate: number;
    let taxBracket: string;
    const annualizedProfit = grossProfit * (12 / (period === 'week' ? 0.23 : period === 'month' ? 1 : period === 'quarter' ? 3 : 12));

    if (annualizedProfit <= 50000) {
      taxRate = 0.19;
      taxBracket = 'Small Profits Rate (19%)';
    } else if (annualizedProfit <= 250000) {
      taxRate = 0.25; // Simplified - actual marginal relief calculation is more complex
      taxBracket = 'Marginal Relief (19-25%)';
    } else {
      taxRate = 0.25;
      taxBracket = 'Main Rate (25%)';
    }

    const estimatedTax = grossProfit > 0 ? grossProfit * taxRate : 0;
    const takeHome = grossProfit - estimatedTax;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, taxDeductible: 0 };
      }
      acc[category].total += parseFloat(exp.amount || 0);
      acc[category].count += 1;
      acc[category].taxDeductible += parseFloat(exp.amount || 0) * (exp.tax_deductible_percent || 100) / 100;
      return acc;
    }, {} as { [key: string]: { total: number; count: number; taxDeductible: number } });

    // Calculate weekly breakdown if showing month or longer
    const weeklyBreakdown: { week: string; revenue: number; expenses: number; profit: number }[] = [];

    if (period !== 'week') {
      const weeklyData: { [key: string]: { revenue: number; expenses: number } } = {};

      invoices.forEach(inv => {
        const date = new Date(inv.paid_at || inv.invoice_date);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { revenue: 0, expenses: 0 };
        }
        weeklyData[weekKey].revenue += parseFloat(inv.total || 0) - parseFloat(inv.vat_amount || 0);
      });

      expenses.forEach(exp => {
        const date = new Date(exp.date);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { revenue: 0, expenses: 0 };
        }
        weeklyData[weekKey].expenses += parseFloat(exp.amount || 0) * (exp.tax_deductible_percent || 100) / 100;
      });

      mileage.forEach(m => {
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
        start: dateParams[0] || null,
        end: dateParams[1] || new Date().toISOString().split('T')[0]
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

  } catch (error) {
    console.error('Tax summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch tax summary' }, { status: 500 });
  } finally {
    client.release();
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
