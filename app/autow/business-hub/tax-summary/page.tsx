'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TaxSummary {
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
    byCategory: { [key: string]: { total: number; count: number; taxDeductible: number } };
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
  weeklyBreakdown: { week: string; revenue: number; expenses: number; profit: number }[];
  invoices: any[];
  expensesList: any[];
  mileageList: any[];
}

export default function TaxSummaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<TaxSummary | null>(null);
  const [showDetails, setShowDetails] = useState<'invoices' | 'expenses' | 'mileage' | null>(null);
  const [vatYear, setVatYear] = useState(new Date().getFullYear());
  const [selectedVatQuarter, setSelectedVatQuarter] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchTaxSummary();
  }, [router, period, customStart, customEnd]);

  const fetchTaxSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('autow_token');
      let url = `/api/autow/business-hub/tax-summary?period=${period}`;

      if (period === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching tax summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Tax Year';
      case 'custom': return 'Custom Range';
      case 'vat-quarter': return `VAT Q${selectedVatQuarter} ${vatYear}`;
      default: return 'This Month';
    }
  };

  // VAT Quarter calculation - standard UK quarters
  const getVatQuarterDates = (quarter: number, year: number): { start: string; end: string } => {
    const quarters: { [key: number]: { startMonth: number; endMonth: number } } = {
      1: { startMonth: 0, endMonth: 2 },   // Jan-Mar
      2: { startMonth: 3, endMonth: 5 },   // Apr-Jun
      3: { startMonth: 6, endMonth: 8 },   // Jul-Sep
      4: { startMonth: 9, endMonth: 11 },  // Oct-Dec
    };

    const { startMonth, endMonth } = quarters[quarter];
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth + 1, 0); // Last day of end month

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };

  const handleVatQuarterSelect = (quarter: number) => {
    setSelectedVatQuarter(quarter);
    setPeriod('custom');
    const { start, end } = getVatQuarterDates(quarter, vatYear);
    setCustomStart(start);
    setCustomEnd(end);
  };

  // Export functions
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('autow_token');
      let url = `/api/autow/business-hub/export?type=tax-summary&format=csv&period=${period}`;

      if (customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `autow-tax-summary-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('autow_token');
      let url = `/api/autow/business-hub/export?type=tax-summary&format=pdf&period=${period}`;

      if (customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `autow-tax-summary-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.details || error.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading tax summary...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="tax-container">
      {/* Header */}
      <div style={styles.header} className="tax-header">
        <div style={styles.headerLeft}>
          <h1 style={styles.title} className="tax-title">Tax Summary</h1>
          <p style={styles.subtitle}>Corporation Tax Estimation & Financial Overview</p>
        </div>
        <button onClick={() => router.push('/autow/business-hub')} style={styles.backBtn}>
          ← Back to Hub
        </button>
      </div>

      {/* Period Selector */}
      <div style={styles.periodSection}>
        <div style={styles.periodButtons}>
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setSelectedVatQuarter(null); }}
              style={{
                ...styles.periodBtn,
                ...(period === p && !selectedVatQuarter ? styles.periodBtnActive : {})
              }}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === 'quarter' ? 'Quarter' : 'Tax Year'}
            </button>
          ))}
        </div>

        {/* VAT Quarter Selector */}
        <div style={styles.vatQuarterSection}>
          <span style={styles.vatQuarterLabel}>VAT Quarter:</span>
          <select
            value={vatYear}
            onChange={(e) => setVatYear(parseInt(e.target.value))}
            style={styles.yearSelect}
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <div style={styles.vatQuarterButtons}>
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => handleVatQuarterSelect(q)}
                style={{
                  ...styles.vatQuarterBtn,
                  ...(selectedVatQuarter === q ? styles.vatQuarterBtnActive : {})
                }}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.periodInfo}>
          Showing: <strong>{selectedVatQuarter ? `VAT Q${selectedVatQuarter} ${vatYear}` : getPeriodLabel()}</strong>
          {data?.dateRange?.start && (
            <span style={styles.dateRange}>
              ({formatDate(data.dateRange.start)} - {formatDate(data.dateRange.end)})
            </span>
          )}
        </div>

        {/* Export Buttons */}
        <div style={styles.exportButtons}>
          <button
            onClick={handleExportCSV}
            style={styles.exportBtnCyan}
            disabled={exporting || !data}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={handleExportPDF}
            style={styles.exportBtnGreen}
            disabled={exporting || !data}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Main Summary Card */}
          <div style={styles.mainCard} className="tax-main-card">
            <h2 style={styles.mainTitle}>Tax Calculation Summary</h2>

            <div style={styles.calculationGrid} className="tax-calc-grid">
              {/* Revenue Section */}
              <div style={styles.calcSection}>
                <div style={styles.calcHeader}>
                  <span style={styles.calcIcon}>💰</span>
                  <span>Revenue</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Total Invoiced (inc. VAT)</span>
                  <span style={styles.calcValueGreen}>{formatCurrency(data.revenue.total)}</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Less: VAT Collected</span>
                  <span style={styles.calcValueRed}>-{formatCurrency(data.revenue.vatCollected)}</span>
                </div>
                <div style={styles.calcRowTotal}>
                  <span>Net Revenue</span>
                  <span>{formatCurrency(data.revenue.net)}</span>
                </div>
              </div>

              {/* Deductions Section */}
              <div style={styles.calcSection}>
                <div style={styles.calcHeader}>
                  <span style={styles.calcIcon}>📋</span>
                  <span>Deductions</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Business Expenses</span>
                  <span style={styles.calcValueRed}>-{formatCurrency(data.expenses.taxDeductible)}</span>
                </div>
                <div style={styles.calcRow}>
                  <span>HMRC Mileage Claim</span>
                  <span style={styles.calcValueRed}>-{formatCurrency(data.mileage.claimAmount)}</span>
                </div>
                <div style={styles.calcRowTotal}>
                  <span>Total Deductions</span>
                  <span>-{formatCurrency(data.tax.totalDeductions)}</span>
                </div>
              </div>

              {/* Profit Section */}
              <div style={styles.calcSection}>
                <div style={styles.calcHeader}>
                  <span style={styles.calcIcon}>📊</span>
                  <span>Taxable Profit</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Net Revenue</span>
                  <span>{formatCurrency(data.revenue.net)}</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Less: Deductions</span>
                  <span style={styles.calcValueRed}>-{formatCurrency(data.tax.totalDeductions)}</span>
                </div>
                <div style={styles.calcRowTotal}>
                  <span>Gross Profit</span>
                  <span style={data.tax.grossProfit >= 0 ? styles.calcValueGreen : styles.calcValueRed}>
                    {formatCurrency(data.tax.grossProfit)}
                  </span>
                </div>
              </div>

              {/* Tax Section */}
              <div style={styles.calcSectionHighlight}>
                <div style={styles.calcHeader}>
                  <span style={styles.calcIcon}>🏛️</span>
                  <span>Corporation Tax</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Taxable Profit</span>
                  <span>{formatCurrency(data.tax.grossProfit)}</span>
                </div>
                <div style={styles.calcRow}>
                  <span>Tax Rate</span>
                  <span>{data.tax.taxRate}%</span>
                </div>
                <div style={styles.calcRow}>
                  <span style={styles.smallText}>{data.tax.taxBracket}</span>
                  <span></span>
                </div>
                <div style={styles.calcRowHighlight}>
                  <span style={styles.holdBackLabel}>TAX TO HOLD BACK</span>
                  <span style={styles.holdBackValue}>{formatCurrency(data.tax.holdBack)}</span>
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div style={styles.finalSummary} className="tax-final-summary">
              <div style={styles.summaryBox} className="tax-summary-box">
                <div style={styles.summaryLabel}>Your Take Home</div>
                <div style={styles.summaryValue}>{formatCurrency(data.tax.takeHome)}</div>
              </div>
              <div style={styles.summaryBox}>
                <div style={styles.summaryLabel}>Hold for Tax</div>
                <div style={styles.summaryValueOrange}>{formatCurrency(data.tax.holdBack)}</div>
              </div>
              {data.vat.liability > 0 && (
                <div style={styles.summaryBox}>
                  <div style={styles.summaryLabel}>VAT Liability</div>
                  <div style={styles.summaryValueCyan}>{formatCurrency(data.vat.liability)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={styles.statsGrid} className="tax-stats-grid">
            <button
              style={styles.statCardClickable}
              onClick={() => setShowDetails(showDetails === 'invoices' ? null : 'invoices')}
            >
              <div style={styles.statValue}>{data.revenue.invoiceCount}</div>
              <div style={styles.statLabel}>Paid Invoices</div>
              <div style={styles.statAmount}>{formatCurrency(data.revenue.total)}</div>
            </button>
            <button
              style={styles.statCardClickable}
              onClick={() => setShowDetails(showDetails === 'expenses' ? null : 'expenses')}
            >
              <div style={styles.statValue}>{data.expenses.count}</div>
              <div style={styles.statLabel}>Expenses</div>
              <div style={styles.statAmount}>{formatCurrency(data.expenses.total)}</div>
            </button>
            <button
              style={styles.statCardClickable}
              onClick={() => setShowDetails(showDetails === 'mileage' ? null : 'mileage')}
            >
              <div style={styles.statValue}>{data.mileage.totalMiles.toFixed(0)}</div>
              <div style={styles.statLabel}>Miles</div>
              <div style={styles.statAmount}>{formatCurrency(data.mileage.claimAmount)}</div>
            </button>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{data.tax.taxRate}%</div>
              <div style={styles.statLabel}>Tax Rate</div>
              <div style={styles.statAmountSmall}>{data.tax.taxBracket}</div>
            </div>
          </div>

          {/* Expenses by Category */}
          {Object.keys(data.expenses.byCategory).length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Expenses by Category</h3>
              <div style={styles.categoryGrid} className="tax-category-grid">
                {Object.entries(data.expenses.byCategory)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([category, catData]) => (
                    <div key={category} style={styles.categoryCard}>
                      <div style={styles.categoryName}>{category}</div>
                      <div style={styles.categoryAmount}>{formatCurrency(catData.total)}</div>
                      <div style={styles.categoryMeta}>
                        {catData.count} expense{catData.count !== 1 ? 's' : ''} ·
                        {formatCurrency(catData.taxDeductible)} deductible
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Weekly Breakdown */}
          {data.weeklyBreakdown.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Weekly Breakdown</h3>
              <div style={styles.weeklyGrid} className="tax-weekly-grid">
                {data.weeklyBreakdown.map((week, index) => (
                  <div key={index} style={styles.weekCard}>
                    <div style={styles.weekHeader}>{week.week}</div>
                    <div style={styles.weekRow}>
                      <span>Revenue</span>
                      <span style={styles.weekGreen}>{formatCurrency(week.revenue)}</span>
                    </div>
                    <div style={styles.weekRow}>
                      <span>Expenses</span>
                      <span style={styles.weekRed}>-{formatCurrency(week.expenses)}</span>
                    </div>
                    <div style={styles.weekRowTotal}>
                      <span>Profit</span>
                      <span style={week.profit >= 0 ? styles.weekGreen : styles.weekRed}>
                        {formatCurrency(week.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VAT Summary */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>VAT Summary</h3>
            <div style={styles.vatGrid} className="tax-vat-grid">
              <div style={styles.vatCard}>
                <div style={styles.vatLabel}>VAT Collected</div>
                <div style={styles.vatValueGreen}>{formatCurrency(data.vat.collected)}</div>
              </div>
              <div style={styles.vatCard}>
                <div style={styles.vatLabel}>VAT Paid (Expenses)</div>
                <div style={styles.vatValueRed}>{formatCurrency(data.vat.paid)}</div>
              </div>
              <div style={styles.vatCard}>
                <div style={styles.vatLabel}>VAT Liability</div>
                <div style={styles.vatValueCyan}>{formatCurrency(data.vat.liability)}</div>
              </div>
            </div>
          </div>

          {/* Details Modal */}
          {showDetails && (
            <div style={styles.modal}>
              <div style={styles.modalContent} className="tax-modal-content">
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>
                    {showDetails === 'invoices' ? 'Paid Invoices' :
                     showDetails === 'expenses' ? 'Expenses' : 'Mileage'}
                  </h3>
                  <button onClick={() => setShowDetails(null)} style={styles.closeBtn}>×</button>
                </div>
                <div style={styles.modalBody}>
                  {showDetails === 'invoices' && (
                    <>
                      {/* Desktop Table */}
                      <div className="desktop-table">
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Invoice</th>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Client</th>
                              <th style={styles.th}>Net</th>
                              <th style={styles.th}>VAT</th>
                              <th style={styles.th}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.invoices.map((inv) => (
                              <tr key={inv.id}>
                                <td style={styles.td}>{inv.invoice_number}</td>
                                <td style={styles.td}>{formatDate(inv.paid_at || inv.invoice_date)}</td>
                                <td style={styles.td}>{inv.client_name}</td>
                                <td style={styles.td}>{formatCurrency(parseFloat(inv.subtotal))}</td>
                                <td style={styles.td}>{formatCurrency(parseFloat(inv.vat_amount))}</td>
                                <td style={styles.tdGreen}>{formatCurrency(parseFloat(inv.total))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile Cards */}
                      <div className="mobile-cards">
                        {data.invoices.map((inv) => (
                          <div key={inv.id} style={styles.mobileCard}>
                            <div style={styles.mobileCardHeader}>
                              <span style={styles.mobileCardTitle}>{inv.invoice_number}</span>
                              <span style={styles.mobileCardAmount}>{formatCurrency(parseFloat(inv.total))}</span>
                            </div>
                            <div style={styles.mobileCardBody}>
                              <span>{inv.client_name}</span>
                              <span style={styles.mobileCardDate}>{formatDate(inv.paid_at || inv.invoice_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {showDetails === 'expenses' && (
                    <>
                      {/* Desktop Table */}
                      <div className="desktop-table">
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Category</th>
                              <th style={styles.th}>Description</th>
                              <th style={styles.th}>Amount</th>
                              <th style={styles.th}>Tax %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.expensesList.map((exp) => (
                              <tr key={exp.id}>
                                <td style={styles.td}>{formatDate(exp.date)}</td>
                                <td style={styles.td}>{exp.category}</td>
                                <td style={styles.td}>{exp.description}</td>
                                <td style={styles.tdRed}>{formatCurrency(parseFloat(exp.amount))}</td>
                                <td style={styles.td}>{exp.tax_deductible_percent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile Cards */}
                      <div className="mobile-cards">
                        {data.expensesList.map((exp) => (
                          <div key={exp.id} style={styles.mobileCard}>
                            <div style={styles.mobileCardHeader}>
                              <span style={styles.mobileCardTitle}>{exp.category}</span>
                              <span style={{...styles.mobileCardAmount, color: '#ff6b6b'}}>{formatCurrency(parseFloat(exp.amount))}</span>
                            </div>
                            <div style={styles.mobileCardBody}>
                              <span>{exp.description}</span>
                              <span style={styles.mobileCardDate}>{formatDate(exp.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {showDetails === 'mileage' && (
                    <>
                      {/* Desktop Table */}
                      <div className="desktop-table">
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Description</th>
                              <th style={styles.th}>Miles</th>
                              <th style={styles.th}>Claim</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.mileageList.map((m) => (
                              <tr key={m.id}>
                                <td style={styles.td}>{formatDate(m.date)}</td>
                                <td style={styles.td}>{m.description}</td>
                                <td style={styles.td}>{parseFloat(m.miles).toFixed(1)}</td>
                                <td style={styles.tdCyan}>{formatCurrency(parseFloat(m.claim_amount))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile Cards */}
                      <div className="mobile-cards">
                        {data.mileageList.map((m) => (
                          <div key={m.id} style={styles.mobileCard}>
                            <div style={styles.mobileCardHeader}>
                              <span style={styles.mobileCardTitle}>{parseFloat(m.miles).toFixed(1)} mi</span>
                              <span style={{...styles.mobileCardAmount, color: '#00c8ff'}}>{formatCurrency(parseFloat(m.claim_amount))}</span>
                            </div>
                            <div style={styles.mobileCardBody}>
                              <span>{m.description}</span>
                              <span style={styles.mobileCardDate}>{formatDate(m.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div style={styles.infoSection}>
            <h3 style={styles.infoTitle}>How This Works</h3>
            <div style={styles.infoContent}>
              <div style={styles.infoItem}>
                <strong>Corporation Tax</strong> is paid on profits, not revenue.
                We calculate: <em>Profit = Revenue (minus VAT) - Allowable Deductions</em>
              </div>
              <div style={styles.infoItem}>
                <strong>Tax Rates 2024/25:</strong> 19% for profits under £50k,
                25% for profits over £250k, marginal relief in between.
              </div>
              <div style={styles.infoItem}>
                <strong>VAT</strong> is separate from Corporation Tax.
                You collect it from customers and pay it to HMRC quarterly.
              </div>
              <div style={styles.infoItem}>
                <strong>Mileage</strong> is claimed at HMRC approved rates:
                45p/mile for first 10,000 miles, 25p/mile after.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Styles */}
      <style>{`
        .mobile-cards { display: none; }
        .desktop-table { display: block; }

        @media (max-width: 768px) {
          .tax-header { flex-direction: column !important; align-items: flex-start !important; }
          .tax-modal-content { max-width: 95vw !important; }
          .mobile-cards { display: block !important; }
          .desktop-table { display: none !important; }
          .tax-category-grid, .tax-weekly-grid, .tax-vat-grid { grid-template-columns: 1fr 1fr !important; }
          .tax-final-summary { flex-direction: column !important; gap: 12px !important; }
          .tax-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 480px) {
          .tax-container { padding: 15px 10px !important; }
          .tax-main-card { padding: 15px !important; }
          .tax-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .tax-category-grid, .tax-weekly-grid, .tax-vat-grid { grid-template-columns: 1fr !important; }
          .tax-title { font-size: 22px !important; }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#000',
    minHeight: '100vh',
    padding: '20px',
    color: '#fff',
  },
  header: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '24px 30px',
    marginBottom: '24px',
    border: '1px solid rgba(0, 200, 255, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  headerLeft: {},
  title: {
    color: '#00c8ff',
    fontSize: '28px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '14px',
    margin: '0',
  },
  backBtn: {
    background: 'rgba(0, 200, 255, 0.1)',
    border: '2px solid rgba(0, 200, 255, 0.3)',
    color: '#00c8ff',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '14px',
  },
  periodSection: {
    marginBottom: '24px',
  },
  periodButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  periodBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#aaa',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  periodBtnActive: {
    background: 'rgba(0, 200, 255, 0.2)',
    borderColor: '#00c8ff',
    color: '#00c8ff',
  },
  vatQuarterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  vatQuarterLabel: {
    color: '#ffa500',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  yearSelect: {
    background: '#0a0a0a',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  vatQuarterButtons: {
    display: 'flex',
    gap: '8px',
  },
  vatQuarterBtn: {
    background: 'rgba(255, 165, 0, 0.1)',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    color: '#ffa500',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
    transition: 'all 0.2s',
  },
  vatQuarterBtnActive: {
    background: 'rgba(255, 165, 0, 0.3)',
    borderColor: '#ffa500',
    color: '#fff',
  },
  exportButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
  },
  exportBtnCyan: {
    background: 'rgba(0, 200, 255, 0.2)',
    border: '1px solid rgba(0, 200, 255, 0.4)',
    color: '#00c8ff',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  exportBtnGreen: {
    background: 'rgba(48, 255, 55, 0.2)',
    border: '1px solid rgba(48, 255, 55, 0.4)',
    color: '#30ff37',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  periodInfo: {
    color: '#aaa',
    fontSize: '14px',
  },
  dateRange: {
    color: '#666',
    marginLeft: '10px',
  },
  mainCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    border: '2px solid rgba(0, 200, 255, 0.3)',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '24px',
  },
  mainTitle: {
    color: '#00c8ff',
    fontSize: '22px',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
  },
  calculationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  calcSection: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  calcSectionHighlight: {
    background: 'rgba(255, 165, 0, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid rgba(255, 165, 0, 0.3)',
  },
  calcHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#00c8ff',
    fontSize: '16px',
    fontWeight: '600' as const,
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  calcIcon: {
    fontSize: '20px',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    color: '#aaa',
    fontSize: '14px',
  },
  calcRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0 0',
    marginTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600' as const,
  },
  calcRowHighlight: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0 0 0',
    marginTop: '12px',
    borderTop: '2px solid rgba(255, 165, 0, 0.3)',
  },
  calcValueGreen: {
    color: '#30ff37',
    fontWeight: '600' as const,
  },
  calcValueRed: {
    color: '#ff6b6b',
    fontWeight: '600' as const,
  },
  holdBackLabel: {
    color: '#ffa500',
    fontSize: '12px',
    fontWeight: '700' as const,
    letterSpacing: '1px',
  },
  holdBackValue: {
    color: '#ffa500',
    fontSize: '24px',
    fontWeight: '700' as const,
  },
  smallText: {
    fontSize: '11px',
    color: '#666',
    fontStyle: 'italic' as const,
  },
  finalSummary: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    flexWrap: 'wrap' as const,
  },
  summaryBox: {
    textAlign: 'center' as const,
    padding: '20px 40px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '12px',
    minWidth: '180px',
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  summaryValue: {
    color: '#30ff37',
    fontSize: '32px',
    fontWeight: '700' as const,
  },
  summaryValueOrange: {
    color: '#ffa500',
    fontSize: '32px',
    fontWeight: '700' as const,
  },
  summaryValueCyan: {
    color: '#00c8ff',
    fontSize: '32px',
    fontWeight: '700' as const,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#1a1a1a',
    border: '1px solid rgba(0, 200, 255, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  statCardClickable: {
    background: '#1a1a1a',
    border: '1px solid rgba(0, 200, 255, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: 'inherit',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: '#00c8ff',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#aaa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statAmount: {
    fontSize: '14px',
    color: '#30ff37',
    marginTop: '8px',
  },
  statAmountSmall: {
    fontSize: '11px',
    color: '#666',
    marginTop: '8px',
  },
  section: {
    background: '#1a1a1a',
    border: '1px solid rgba(0, 200, 255, 0.15)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionTitle: {
    color: '#00c8ff',
    fontSize: '18px',
    margin: '0 0 20px 0',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  categoryCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  categoryName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600' as const,
    marginBottom: '8px',
  },
  categoryAmount: {
    color: '#ff6b6b',
    fontSize: '20px',
    fontWeight: '700' as const,
  },
  categoryMeta: {
    color: '#666',
    fontSize: '11px',
    marginTop: '8px',
  },
  weeklyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  weekCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  weekHeader: {
    color: '#00c8ff',
    fontSize: '14px',
    fontWeight: '600' as const,
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  weekRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    color: '#aaa',
    fontSize: '13px',
  },
  weekRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0 0 0',
    marginTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    fontWeight: '600' as const,
    fontSize: '14px',
    color: '#fff',
  },
  weekGreen: {
    color: '#30ff37',
  },
  weekRed: {
    color: '#ff6b6b',
  },
  vatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  vatCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  vatLabel: {
    color: '#aaa',
    fontSize: '12px',
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
  },
  vatValueGreen: {
    color: '#30ff37',
    fontSize: '24px',
    fontWeight: '700' as const,
  },
  vatValueRed: {
    color: '#ff6b6b',
    fontSize: '24px',
    fontWeight: '700' as const,
  },
  vatValueCyan: {
    color: '#00c8ff',
    fontSize: '24px',
    fontWeight: '700' as const,
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modalContent: {
    background: '#1a1a1a',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '80vh',
    overflow: 'hidden',
    border: '1px solid rgba(0, 200, 255, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#00c8ff',
    fontSize: '20px',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0 8px',
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto' as const,
    maxHeight: 'calc(80vh - 80px)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px',
    color: '#aaa',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.3)',
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#ccc',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tdGreen: {
    padding: '12px',
    fontSize: '13px',
    color: '#30ff37',
    fontWeight: '600' as const,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tdRed: {
    padding: '12px',
    fontSize: '13px',
    color: '#ff6b6b',
    fontWeight: '600' as const,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tdCyan: {
    padding: '12px',
    fontSize: '13px',
    color: '#00c8ff',
    fontWeight: '600' as const,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  infoSection: {
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    padding: '24px',
  },
  infoTitle: {
    color: '#30ff37',
    fontSize: '16px',
    margin: '0 0 16px 0',
  },
  infoContent: {
    display: 'grid',
    gap: '12px',
  },
  infoItem: {
    color: '#aaa',
    fontSize: '13px',
    lineHeight: 1.6,
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
  },
  loadingText: {
    color: '#00c8ff',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  mobileCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  mobileCardTitle: {
    color: '#00c8ff',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  mobileCardAmount: {
    color: '#30ff37',
    fontSize: '16px',
    fontWeight: '700' as const,
  },
  mobileCardBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#aaa',
    fontSize: '12px',
  },
  mobileCardDate: {
    color: '#666',
  },
};
