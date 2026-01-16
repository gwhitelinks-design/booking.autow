'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  client_name: string;
  subtotal: string;
  vat_amount: string;
  total: string;
  payment_method: string;
  paid_at: string;
  vehicle_reg?: string;
}

interface Summary {
  totalReceived: number;
  totalVat: number;
  invoiceCount: number;
  byMonth: { [key: string]: { total: number; count: number } };
}

export default function InvoicesSummaryPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalReceived: 0,
    totalVat: 0,
    invoiceCount: 0,
    byMonth: {},
  });
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  useEffect(() => {
    fetchInvoices();
  }, [yearFilter, monthFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/list?status=paid&limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredInvoices = data.invoices || [];

        // Apply year/month filters
        if (yearFilter !== 'all' || monthFilter !== 'all') {
          filteredInvoices = filteredInvoices.filter((inv: Invoice) => {
            const date = new Date(inv.paid_at || inv.invoice_date);
            const matchesYear = yearFilter === 'all' || date.getFullYear().toString() === yearFilter;
            const matchesMonth = monthFilter === 'all' || (date.getMonth() + 1).toString() === monthFilter;
            return matchesYear && matchesMonth;
          });
        }

        setInvoices(filteredInvoices);
        calculateSummary(filteredInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (invoiceList: Invoice[]) => {
    let totalReceived = 0;
    let totalVat = 0;
    const byMonth: { [key: string]: { total: number; count: number } } = {};

    invoiceList.forEach((inv) => {
      const total = parseFloat(inv.total) || 0;
      const vat = parseFloat(inv.vat_amount) || 0;
      totalReceived += total;
      totalVat += vat;

      // Group by month
      const date = new Date(inv.paid_at || inv.invoice_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { total: 0, count: 0 };
      }
      byMonth[monthKey].total += total;
      byMonth[monthKey].count += 1;
    });

    setSummary({
      totalReceived: Math.round(totalReceived * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      invoiceCount: invoiceList.length,
      byMonth,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `£${(num || 0).toFixed(2)}`;
  };

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  // Get available years from invoices
  const availableYears = Array.from(
    new Set(
      invoices.map((inv) => new Date(inv.paid_at || inv.invoice_date).getFullYear())
    )
  ).sort((a, b) => b - a);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      minHeight: '100vh',
      backgroundColor: '#000',
      padding: '20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap' as const,
      gap: '15px',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: 'transparent',
      border: '1px solid rgba(0, 200, 255, 0.3)',
      borderRadius: '8px',
      color: '#00c8ff',
      cursor: 'pointer',
      fontSize: '14px',
    },
    title: {
      color: '#fff',
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0,
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    summaryCard: {
      backgroundColor: 'rgba(0, 200, 255, 0.1)',
      border: '1px solid rgba(0, 200, 255, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center' as const,
    },
    summaryLabel: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      marginBottom: '8px',
    },
    summaryValue: {
      color: '#00c8ff',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    filterSection: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap' as const,
    },
    select: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '10px 15px',
      color: '#fff',
      fontSize: '14px',
      minWidth: '150px',
    },
    tableContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      marginBottom: '30px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      backgroundColor: 'rgba(0, 200, 255, 0.1)',
      color: '#00c8ff',
      padding: '15px',
      textAlign: 'left' as const,
      fontSize: '14px',
      fontWeight: '600',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    td: {
      padding: '15px',
      color: '#fff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      fontSize: '14px',
    },
    monthlySection: {
      marginTop: '30px',
    },
    sectionTitle: {
      color: '#fff',
      fontSize: '20px',
      marginBottom: '20px',
    },
    monthlyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
    },
    monthCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    monthName: {
      color: '#fff',
      fontSize: '16px',
    },
    monthStats: {
      textAlign: 'right' as const,
    },
    monthTotal: {
      color: '#30ff37',
      fontSize: '18px',
      fontWeight: 'bold',
    },
    monthCount: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '12px',
    },
    loading: {
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center' as const,
      padding: '40px',
    },
    emptyState: {
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center' as const,
      padding: '40px',
    },
    mobileCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '10px',
      padding: '14px',
      marginBottom: '10px',
      border: '1px solid rgba(48, 255, 55, 0.2)',
    },
    mobileCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    mobileCardNumber: {
      color: '#00c8ff',
      fontSize: '14px',
      fontWeight: '600' as const,
    },
    mobileCardAmount: {
      color: '#30ff37',
      fontSize: '18px',
      fontWeight: '700' as const,
    },
    mobileCardBody: {
      marginBottom: '10px',
    },
    mobileCardClient: {
      color: '#fff',
      fontSize: '14px',
    },
    mobileCardVehicle: {
      color: '#888',
      fontSize: '12px',
      marginTop: '4px',
    },
    mobileCardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mobileCardDate: {
      color: '#888',
      fontSize: '12px',
    },
    mobileCardMethod: {
      color: '#666',
      fontSize: '11px',
    },
  };

  return (
    <div style={styles.container} className="inv-container">
      <div style={styles.header} className="inv-header">
        <button style={styles.backButton} onClick={() => router.push('/autow/business-hub')}>
          ← Back
        </button>
        <h1 style={styles.title} className="inv-title">📊 Invoices Summary</h1>
        <div></div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid} className="inv-summary-grid">
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Received</div>
          <div style={{...styles.summaryValue, color: '#30ff37'}}>
            {formatCurrency(summary.totalReceived)}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>VAT Collected</div>
          <div style={styles.summaryValue}>{formatCurrency(summary.totalVat)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Net Revenue</div>
          <div style={styles.summaryValue}>
            {formatCurrency(summary.totalReceived - summary.totalVat)}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Paid Invoices</div>
          <div style={styles.summaryValue}>{summary.invoiceCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterSection} className="inv-filter-section">
        <select
          style={styles.select}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="all">All Years</option>
          {availableYears.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
        <select
          style={styles.select}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="all">All Months</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div style={styles.loading}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div style={styles.emptyState}>No paid invoices found</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div style={styles.tableContainer} className="desktop-table">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice #</th>
                  <th style={styles.th}>Date Paid</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Payment Method</th>
                  <th style={styles.th}>Subtotal</th>
                  <th style={styles.th}>VAT</th>
                  <th style={{...styles.th, textAlign: 'right' as const}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={styles.td}>{inv.invoice_number}</td>
                    <td style={styles.td}>{formatDate(inv.paid_at || inv.invoice_date)}</td>
                    <td style={styles.td}>{inv.client_name}</td>
                    <td style={styles.td}>{inv.vehicle_reg || '-'}</td>
                    <td style={styles.td}>{inv.payment_method || '-'}</td>
                    <td style={styles.td}>{formatCurrency(inv.subtotal)}</td>
                    <td style={styles.td}>{formatCurrency(inv.vat_amount)}</td>
                    <td style={{...styles.td, textAlign: 'right' as const, color: '#30ff37', fontWeight: 'bold'}}>
                      {formatCurrency(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {invoices.map((inv) => (
              <div key={inv.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <span style={styles.mobileCardNumber}>{inv.invoice_number}</span>
                  <span style={styles.mobileCardAmount}>{formatCurrency(inv.total)}</span>
                </div>
                <div style={styles.mobileCardBody}>
                  <div style={styles.mobileCardClient}>{inv.client_name}</div>
                  <div style={styles.mobileCardVehicle}>{inv.vehicle_reg || '-'}</div>
                </div>
                <div style={styles.mobileCardFooter}>
                  <span style={styles.mobileCardDate}>{formatDate(inv.paid_at || inv.invoice_date)}</span>
                  <span style={styles.mobileCardMethod}>{inv.payment_method || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Monthly Breakdown */}
      {Object.keys(summary.byMonth).length > 0 && (
        <div style={styles.monthlySection}>
          <h2 style={styles.sectionTitle}>Monthly Breakdown</h2>
          <div style={styles.monthlyGrid} className="inv-monthly-grid">
            {Object.entries(summary.byMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthKey, data]) => (
                <div key={monthKey} style={styles.monthCard}>
                  <span style={styles.monthName}>{getMonthName(monthKey)}</span>
                  <div style={styles.monthStats}>
                    <div style={styles.monthTotal}>{formatCurrency(data.total)}</div>
                    <div style={styles.monthCount}>{data.count} invoice{data.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mobile Styles */}
      <style>{`
        .mobile-cards { display: none; }
        .desktop-table { display: block; }

        @media (max-width: 768px) {
          .inv-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .mobile-cards { display: block !important; }
          .desktop-table { display: none !important; }
          .inv-summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .inv-monthly-grid { grid-template-columns: 1fr 1fr !important; }
          .inv-filter-section { flex-direction: column !important; }
        }

        @media (max-width: 480px) {
          .inv-container { padding: 15px 10px !important; }
          .inv-summary-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .inv-monthly-grid { grid-template-columns: 1fr !important; }
          .inv-title { font-size: 20px !important; }
        }
      `}</style>
    </div>
  );
}
