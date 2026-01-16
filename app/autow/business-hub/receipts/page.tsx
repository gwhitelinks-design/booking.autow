'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Receipt {
  id: number;
  receipt_number: string;
  receipt_date: string;
  supplier: string;
  description: string;
  amount: string;
  category: string;
  status: string;
  gdrive_file_url?: string;
}

interface Summary {
  totalSpent: number;
  receiptCount: number;
  byCategory: { [key: string]: { total: number; count: number } };
  byMonth: { [key: string]: { total: number; count: number } };
}

export default function ReceiptsSummaryPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalSpent: 0,
    receiptCount: 0,
    byCategory: {},
    byMonth: {},
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const categories = [
    { value: 'fuel', label: 'Fuel' },
    { value: 'parts', label: 'Parts' },
    { value: 'tools', label: 'Tools' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'misc', label: 'Miscellaneous' },
  ];

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

  useEffect(() => {
    fetchReceipts();
  }, [categoryFilter, yearFilter, monthFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('autow_token');
      let url = '/api/autow/receipt/list?';

      if (categoryFilter !== 'all') {
        url += `category=${categoryFilter}&`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredReceipts = data.receipts || [];

        // Apply year/month filters on frontend
        if (yearFilter !== 'all' || monthFilter !== 'all') {
          filteredReceipts = filteredReceipts.filter((rec: Receipt) => {
            const date = new Date(rec.receipt_date);
            const matchesYear = yearFilter === 'all' || date.getFullYear().toString() === yearFilter;
            const matchesMonth = monthFilter === 'all' || (date.getMonth() + 1).toString() === monthFilter;
            return matchesYear && matchesMonth;
          });
        }

        setReceipts(filteredReceipts);
        calculateSummary(filteredReceipts);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (receiptList: Receipt[]) => {
    let totalSpent = 0;
    const byCategory: { [key: string]: { total: number; count: number } } = {};
    const byMonth: { [key: string]: { total: number; count: number } } = {};

    receiptList.forEach((rec) => {
      const amount = parseFloat(rec.amount) || 0;
      totalSpent += amount;

      // Group by category
      const cat = rec.category || 'misc';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, count: 0 };
      }
      byCategory[cat].total += amount;
      byCategory[cat].count += 1;

      // Group by month
      const date = new Date(rec.receipt_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { total: 0, count: 0 };
      }
      byMonth[monthKey].total += amount;
      byMonth[monthKey].count += 1;
    });

    setSummary({
      totalSpent: Math.round(totalSpent * 100) / 100,
      receiptCount: receiptList.length,
      byCategory,
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

  const getCategoryLabel = (value: string) => {
    const cat = categories.find(c => c.value === value);
    return cat ? cat.label : value;
  };

  // Get available years from receipts
  const availableYears = Array.from(
    new Set(
      receipts.map((rec) => new Date(rec.receipt_date).getFullYear())
    )
  ).sort((a, b) => b - a);

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
    link: {
      color: '#00c8ff',
      textDecoration: 'none',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
    },
    categorySection: {
      marginTop: '30px',
    },
    sectionTitle: {
      color: '#fff',
      fontSize: '20px',
      marginBottom: '20px',
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '30px',
    },
    categoryCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryName: {
      color: '#fff',
      fontSize: '16px',
    },
    categoryStats: {
      textAlign: 'right' as const,
    },
    categoryTotal: {
      color: '#ff6b6b',
      fontSize: '18px',
      fontWeight: 'bold',
    },
    categoryCount: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '12px',
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
      color: '#ff6b6b',
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
      border: '1px solid rgba(255, 255, 255, 0.1)',
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
      color: '#ff6b6b',
      fontSize: '18px',
      fontWeight: '700' as const,
    },
    mobileCardBody: {
      marginBottom: '10px',
    },
    mobileCardDesc: {
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
  };

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'processed':
        return { ...styles.badge, backgroundColor: 'rgba(48, 255, 55, 0.2)', color: '#30ff37' };
      case 'archived':
        return { ...styles.badge, backgroundColor: 'rgba(128, 128, 128, 0.2)', color: '#888' };
      default:
        return { ...styles.badge, backgroundColor: 'rgba(255, 200, 0, 0.2)', color: '#ffc800' };
    }
  };

  return (
    <div style={styles.container} className="rec-container">
      <div style={styles.header} className="rec-header">
        <button style={styles.backButton} onClick={() => router.push('/autow/business-hub')}>
          ← Back
        </button>
        <h1 style={styles.title} className="rec-title">🧾 Receipts Summary</h1>
        <div></div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid} className="rec-summary-grid">
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Spent</div>
          <div style={{...styles.summaryValue, color: '#ff6b6b'}}>
            {formatCurrency(summary.totalSpent)}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Receipts</div>
          <div style={styles.summaryValue}>{summary.receiptCount}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Categories</div>
          <div style={styles.summaryValue}>{Object.keys(summary.byCategory).length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Avg per Receipt</div>
          <div style={styles.summaryValue}>
            {summary.receiptCount > 0
              ? formatCurrency(summary.totalSpent / summary.receiptCount)
              : '£0.00'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterSection} className="rec-filter-section">
        <select
          style={styles.select}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
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

      {/* Receipts Table */}
      {loading ? (
        <div style={styles.loading}>Loading receipts...</div>
      ) : receipts.length === 0 ? (
        <div style={styles.emptyState}>No receipts found</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div style={styles.tableContainer} className="desktop-table">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Receipt #</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Status</th>
                  <th style={{...styles.th, textAlign: 'right' as const}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((rec) => (
                  <tr key={rec.id}>
                    <td style={styles.td}>
                      {rec.gdrive_file_url ? (
                        <a
                          href={rec.gdrive_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.link}
                        >
                          {rec.receipt_number}
                        </a>
                      ) : (
                        rec.receipt_number
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(rec.receipt_date)}</td>
                    <td style={styles.td}>{rec.supplier}</td>
                    <td style={styles.td}>{rec.description || '-'}</td>
                    <td style={styles.td}>{getCategoryLabel(rec.category)}</td>
                    <td style={styles.td}>
                      <span style={getStatusBadgeStyle(rec.status)}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{...styles.td, textAlign: 'right' as const, color: '#ff6b6b', fontWeight: 'bold'}}>
                      {formatCurrency(rec.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {receipts.map((rec) => (
              <div key={rec.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <span style={styles.mobileCardNumber}>
                    {rec.gdrive_file_url ? (
                      <a href={rec.gdrive_file_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        {rec.receipt_number}
                      </a>
                    ) : rec.receipt_number}
                  </span>
                  <span style={styles.mobileCardAmount}>{formatCurrency(rec.amount)}</span>
                </div>
                <div style={styles.mobileCardBody}>
                  <div>{rec.supplier}</div>
                  <div style={styles.mobileCardDesc}>{rec.description || '-'}</div>
                </div>
                <div style={styles.mobileCardFooter}>
                  <span style={styles.mobileCardDate}>{formatDate(rec.receipt_date)}</span>
                  <span style={getStatusBadgeStyle(rec.status)}>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category Breakdown */}
      {Object.keys(summary.byCategory).length > 0 && (
        <div style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>By Category</h2>
          <div style={styles.categoryGrid} className="rec-category-grid">
            {Object.entries(summary.byCategory)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([category, data]) => (
                <div key={category} style={styles.categoryCard}>
                  <span style={styles.categoryName}>{getCategoryLabel(category)}</span>
                  <div style={styles.categoryStats}>
                    <div style={styles.categoryTotal}>{formatCurrency(data.total)}</div>
                    <div style={styles.categoryCount}>{data.count} receipt{data.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {Object.keys(summary.byMonth).length > 0 && (
        <div style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>Monthly Breakdown</h2>
          <div style={styles.monthlyGrid} className="rec-monthly-grid">
            {Object.entries(summary.byMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthKey, data]) => (
                <div key={monthKey} style={styles.monthCard}>
                  <span style={styles.monthName}>{getMonthName(monthKey)}</span>
                  <div style={styles.monthStats}>
                    <div style={styles.monthTotal}>{formatCurrency(data.total)}</div>
                    <div style={styles.monthCount}>{data.count} receipt{data.count !== 1 ? 's' : ''}</div>
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
          .rec-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .mobile-cards { display: block !important; }
          .desktop-table { display: none !important; }
          .rec-summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rec-category-grid, .rec-monthly-grid { grid-template-columns: 1fr 1fr !important; }
          .rec-filter-section { flex-direction: column !important; }
        }

        @media (max-width: 480px) {
          .rec-container { padding: 15px 10px !important; }
          .rec-summary-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .rec-category-grid, .rec-monthly-grid { grid-template-columns: 1fr !important; }
          .rec-title { font-size: 20px !important; }
        }
      `}</style>
    </div>
  );
}
