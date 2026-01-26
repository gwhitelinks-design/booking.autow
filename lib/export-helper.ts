/**
 * Export Helper Library
 * Generates CSV exports for mileage, expenses, and tax reports
 */

// Generic CSV column definition
interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

/**
 * Generic CSV generator
 */
export function generateCSV<T>(data: T[], columns: CSVColumn<T>[]): string {
  // Header row
  const headers = columns.map((col) => escapeCSV(col.header)).join(',');

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.accessor(row);
        return escapeCSV(value?.toString() ?? '');
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Escape special characters for CSV
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format date for export
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format currency for export
 */
function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// =============================================================================
// MILEAGE EXPORT
// =============================================================================

export interface MileageEntry {
  id: number;
  date: string;
  vehicle: string;
  start_location: string;
  destination: string;
  purpose: string;
  miles: number | string;
  rate_applied?: number | string;
  claim_amount: number | string;
  invoice_id?: number | null;
  notes?: string;
  created_at?: string;
}

export interface MileageSummary {
  totalMiles: number;
  totalClaim: number;
  first10kMiles: number;
  after10kMiles: number;
  first10kClaim: number;
  after10kClaim: number;
}

const VEHICLE_LABELS: Record<string, string> = {
  ford_ranger: 'Ford Ranger',
  recovery_truck: 'Recovery Truck',
  partner_car: "Partner's Car",
};

export function generateMileageCSV(entries: MileageEntry[], summary?: MileageSummary): string {
  const columns: CSVColumn<MileageEntry>[] = [
    { header: 'Date', accessor: (row) => formatDate(row.date) },
    { header: 'Vehicle', accessor: (row) => VEHICLE_LABELS[row.vehicle] || row.vehicle },
    { header: 'From', accessor: (row) => row.start_location },
    { header: 'To', accessor: (row) => row.destination },
    { header: 'Purpose', accessor: (row) => row.purpose || '' },
    { header: 'Miles', accessor: (row) => parseFloat(String(row.miles)).toFixed(1) },
    { header: 'Rate (p/mi)', accessor: (row) => row.rate_applied ? (parseFloat(String(row.rate_applied)) * 100).toFixed(0) : '' },
    { header: 'Claim Amount', accessor: (row) => formatCurrency(row.claim_amount) },
    { header: 'Notes', accessor: (row) => row.notes || '' },
  ];

  let csv = generateCSV(entries, columns);

  // Add summary section if provided
  if (summary) {
    csv += '\n\n';
    csv += 'SUMMARY\n';
    csv += `Total Miles,${summary.totalMiles.toFixed(1)}\n`;
    csv += `Total Claim,${formatCurrency(summary.totalClaim)}\n`;
    csv += `Miles @ 45p (first 10k),${summary.first10kMiles.toFixed(1)},${formatCurrency(summary.first10kClaim)}\n`;
    csv += `Miles @ 25p (after 10k),${summary.after10kMiles.toFixed(1)},${formatCurrency(summary.after10kClaim)}\n`;
  }

  return csv;
}

// =============================================================================
// EXPENSES EXPORT
// =============================================================================

export interface ExpenseEntry {
  id: number;
  date: string;
  category: string;
  subcategory?: string;
  description: string;
  supplier?: string;
  amount: number | string;
  vat?: number | string;
  payment_method?: string;
  tax_deductible_percent?: number;
  is_recurring?: boolean;
  invoice_id?: number | null;
  created_at?: string;
}

export interface ExpensesTotals {
  total: number;
  vat: number;
  taxDeductible: number;
  count: number;
}

export function generateExpensesCSV(entries: ExpenseEntry[], totals?: ExpensesTotals): string {
  const columns: CSVColumn<ExpenseEntry>[] = [
    { header: 'Date', accessor: (row) => formatDate(row.date) },
    { header: 'Category', accessor: (row) => row.category },
    { header: 'Subcategory', accessor: (row) => row.subcategory || '' },
    { header: 'Description', accessor: (row) => row.description },
    { header: 'Supplier', accessor: (row) => row.supplier || '' },
    { header: 'Amount (exc VAT)', accessor: (row) => formatCurrency(row.amount) },
    { header: 'VAT', accessor: (row) => formatCurrency(row.vat) },
    { header: 'Payment Method', accessor: (row) => row.payment_method || '' },
    { header: 'Tax Deductible %', accessor: (row) => row.tax_deductible_percent?.toString() || '100' },
    { header: 'Recurring', accessor: (row) => row.is_recurring ? 'Yes' : 'No' },
  ];

  let csv = generateCSV(entries, columns);

  // Add totals section if provided
  if (totals) {
    csv += '\n\n';
    csv += 'TOTALS\n';
    csv += `Total Expenses,${formatCurrency(totals.total)}\n`;
    csv += `Total VAT,${formatCurrency(totals.vat)}\n`;
    csv += `Tax Deductible Amount,${formatCurrency(totals.taxDeductible)}\n`;
    csv += `Number of Entries,${totals.count}\n`;
  }

  return csv;
}

// =============================================================================
// TAX SUMMARY EXPORT
// =============================================================================

export interface TaxSummaryData {
  period: string;
  dateRange: { start: string | null; end: string };
  revenue: {
    total: number;
    vatCollected: number;
    net: number;
    invoiceCount: number;
  };
  expenses: {
    total: number;
    vatPaid: number;
    taxDeductible: number;
    count: number;
    byCategory: Record<string, { total: number; count: number; taxDeductible: number }>;
  };
  mileage: {
    totalMiles: number;
    claimAmount: number;
    count: number;
  };
  tax: {
    totalDeductions: number;
    grossProfit: number;
    annualizedProfit: number;
    taxRate: number;
    taxBracket: string;
    estimatedTax: number;
    takeHome: number;
    holdBack: number;
  };
  vat: {
    collected: number;
    paid: number;
    liability: number;
  };
}

export function generateTaxSummaryCSV(data: TaxSummaryData): string {
  const lines: string[] = [];

  // Header
  lines.push('AUTOW SERVICES - TAX SUMMARY REPORT');
  lines.push(`Period,${data.period}`);
  lines.push(`Date Range,${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`);
  lines.push('');

  // Revenue Section
  lines.push('REVENUE');
  lines.push(`Total Invoiced (inc VAT),${formatCurrency(data.revenue.total)}`);
  lines.push(`VAT Collected,${formatCurrency(data.revenue.vatCollected)}`);
  lines.push(`Net Revenue,${formatCurrency(data.revenue.net)}`);
  lines.push(`Invoice Count,${data.revenue.invoiceCount}`);
  lines.push('');

  // Expenses Section
  lines.push('EXPENSES');
  lines.push(`Total Expenses,${formatCurrency(data.expenses.total)}`);
  lines.push(`VAT Paid,${formatCurrency(data.expenses.vatPaid)}`);
  lines.push(`Tax Deductible Amount,${formatCurrency(data.expenses.taxDeductible)}`);
  lines.push(`Expense Count,${data.expenses.count}`);
  lines.push('');

  // Expenses by Category
  if (Object.keys(data.expenses.byCategory).length > 0) {
    lines.push('EXPENSES BY CATEGORY');
    lines.push('Category,Total,Count,Tax Deductible');
    Object.entries(data.expenses.byCategory).forEach(([category, catData]) => {
      lines.push(`${escapeCSV(category)},${formatCurrency(catData.total)},${catData.count},${formatCurrency(catData.taxDeductible)}`);
    });
    lines.push('');
  }

  // Mileage Section
  lines.push('MILEAGE');
  lines.push(`Total Miles,${data.mileage.totalMiles.toFixed(1)}`);
  lines.push(`Claim Amount,${formatCurrency(data.mileage.claimAmount)}`);
  lines.push(`Journey Count,${data.mileage.count}`);
  lines.push('');

  // Tax Calculation Section
  lines.push('TAX CALCULATION');
  lines.push(`Net Revenue,${formatCurrency(data.revenue.net)}`);
  lines.push(`Total Deductions,${formatCurrency(data.tax.totalDeductions)}`);
  lines.push(`Gross Profit,${formatCurrency(data.tax.grossProfit)}`);
  lines.push(`Annualized Profit,${formatCurrency(data.tax.annualizedProfit)}`);
  lines.push(`Tax Bracket,${escapeCSV(data.tax.taxBracket)}`);
  lines.push(`Tax Rate,${data.tax.taxRate}%`);
  lines.push(`Estimated Tax,${formatCurrency(data.tax.estimatedTax)}`);
  lines.push(`Take Home,${formatCurrency(data.tax.takeHome)}`);
  lines.push(`Hold Back for Tax,${formatCurrency(data.tax.holdBack)}`);
  lines.push('');

  // VAT Summary
  lines.push('VAT SUMMARY');
  lines.push(`VAT Collected,${formatCurrency(data.vat.collected)}`);
  lines.push(`VAT Paid,${formatCurrency(data.vat.paid)}`);
  lines.push(`VAT Liability,${formatCurrency(data.vat.liability)}`);
  lines.push('');

  // Footer
  lines.push(`Report Generated,${new Date().toLocaleString('en-GB')}`);

  return lines.join('\n');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get filename for export
 */
export function getExportFilename(type: 'mileage' | 'expenses' | 'tax-summary', format: 'csv' | 'pdf'): string {
  const date = new Date().toISOString().split('T')[0];
  return `autow-${type}-${date}.${format}`;
}

/**
 * Create download response headers
 */
export function getCSVHeaders(filename: string): HeadersInit {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  };
}
