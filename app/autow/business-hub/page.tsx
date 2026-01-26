'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HubStats {
  totalInvoiced: number;
  totalReceived: number;
  totalExpenses: number;
  mileageClaim: number;
  receiptCount: number;
  paidInvoiceCount: number;
}

export default function BusinessHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HubStats>({
    totalInvoiced: 0,
    totalReceived: 0,
    totalExpenses: 0,
    mileageClaim: 0,
    receiptCount: 0,
    paidInvoiceCount: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/business-hub/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching hub stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="hub-container">
      {/* Header */}
      <div style={styles.header} className="hub-header">
        <div style={styles.headerLeft} className="hub-header-left">
          <img src="https://autow-services.co.uk/logo.png" alt="AUTOW" style={styles.logo} className="hub-logo" />
          <div style={styles.headerText}>
            <h1 style={styles.title} className="hub-title">Business Hub</h1>
            <p style={styles.subtitle}>Financial Management & Tracking</p>
          </div>
        </div>
        <button onClick={() => router.push('/autow/welcome')} style={styles.backBtn} className="hub-back-btn">
          ← Back to Menu
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid} className="hub-stats-grid">
        <div style={styles.statCard}>
          <div style={styles.statValue} className="hub-stat-value">£{stats.totalReceived.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Received</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue} className="hub-stat-value">£{stats.totalExpenses.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Expenses</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue} className="hub-stat-value">£{stats.mileageClaim.toFixed(2)}</div>
          <div style={styles.statLabel}>Mileage Claim</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue} className="hub-stat-value">{stats.receiptCount}</div>
          <div style={styles.statLabel}>Receipts</div>
        </div>
      </div>

      {/* Hub Cards */}
      <div style={styles.hubGrid} className="hub-grid">
        <button
          onClick={() => router.push('/autow/business-hub/invoices')}
          style={styles.hubCard}
          className="hub-card"
        >
          <div style={styles.hubIcon} className="hub-icon">💰</div>
          <h2 style={styles.hubTitle} className="hub-card-title">Invoices Summary</h2>
          <p style={styles.hubDescription}>
            View paid invoice data and financial breakdown
          </p>
          <div style={styles.hubStat}>
            {stats.paidInvoiceCount} paid invoices
          </div>
        </button>

        <button
          onClick={() => router.push('/autow/business-hub/receipts')}
          style={styles.hubCard}
          className="hub-card"
        >
          <div style={styles.hubIcon} className="hub-icon">🧾</div>
          <h2 style={styles.hubTitle} className="hub-card-title">Receipts Summary</h2>
          <p style={styles.hubDescription}>
            Receipt data and expense tracking
          </p>
          <div style={styles.hubStat}>
            {stats.receiptCount} receipts
          </div>
        </button>

        <button
          onClick={() => router.push('/autow/business-hub/mileage')}
          style={styles.hubCard}
          className="hub-card"
        >
          <div style={styles.hubIcon} className="hub-icon">🚗</div>
          <h2 style={styles.hubTitle} className="hub-card-title">Mileage Tracking</h2>
          <p style={styles.hubDescription}>
            Log journeys and calculate HMRC mileage claims
          </p>
          <div style={styles.hubStat}>
            HMRC rates: 45p/25p per mile
          </div>
        </button>

        <button
          onClick={() => router.push('/autow/business-hub/expenses')}
          style={styles.hubCard}
          className="hub-card"
        >
          <div style={styles.hubIcon} className="hub-icon">📊</div>
          <h2 style={styles.hubTitle} className="hub-card-title">Expenses</h2>
          <p style={styles.hubDescription}>
            Track business expenses by category
          </p>
          <div style={styles.hubStat}>
            £{stats.totalExpenses.toFixed(2)} total
          </div>
        </button>

        <button
          onClick={() => router.push('/autow/business-hub/tax-summary')}
          style={{...styles.hubCard, border: '2px solid rgba(255, 165, 0, 0.4)'}}
          className="hub-card"
        >
          <div style={styles.hubIcon} className="hub-icon">🏛️</div>
          <h2 style={{...styles.hubTitle, color: '#ffa500'}} className="hub-card-title">Tax Summary</h2>
          <p style={styles.hubDescription}>
            Calculate tax holdback and view profit breakdown
          </p>
          <div style={{...styles.hubStat, background: 'rgba(255, 165, 0, 0.15)', color: '#ffa500'}}>
            Corporation Tax Calculator
          </div>
        </button>
      </div>

      {/* Quick Info */}
      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>Tax Year 2025/26</h3>
        <div style={styles.infoGrid} className="hub-info-grid">
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>HMRC Mileage (first 10k):</span>
            <span style={styles.infoValue}>45p per mile</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>HMRC Mileage (after 10k):</span>
            <span style={styles.infoValue}>25p per mile</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Corporation Tax Rate:</span>
            <span style={styles.infoValue}>25%</span>
          </div>
        </div>
      </div>
      {/* Mobile Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hub-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 20px 15px !important;
          }
          .hub-header-left {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .hub-logo { width: 80px !important; }
          .hub-title { font-size: 22px !important; }
          .hub-back-btn { width: 100% !important; }
        }

        @media (max-width: 480px) {
          .hub-container { padding: 15px 10px !important; }
          .hub-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .hub-stat-value { font-size: 20px !important; }
          .hub-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .hub-card { padding: 20px 15px !important; }
          .hub-icon { font-size: 36px !important; margin-bottom: 10px !important; }
          .hub-card-title { font-size: 16px !important; }
          .hub-info-grid { grid-template-columns: 1fr !important; }
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    width: '120px',
    height: 'auto',
    filter: 'drop-shadow(0 4px 12px rgba(0, 200, 255, 0.3))',
  },
  headerText: {},
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '30px',
  },
  statCard: {
    background: '#1a1a1a',
    border: '1px solid rgba(0, 200, 255, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700' as const,
    color: '#00c8ff',
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#aaa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  hubGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  hubCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    border: '2px solid rgba(0, 200, 255, 0.2)',
    borderRadius: '16px',
    padding: '30px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  hubIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  hubTitle: {
    color: '#00c8ff',
    fontSize: '20px',
    margin: '0 0 10px 0',
  },
  hubDescription: {
    color: '#aaa',
    fontSize: '14px',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  hubStat: {
    background: 'rgba(0, 200, 255, 0.1)',
    color: '#00c8ff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600' as const,
    display: 'inline-block',
  },
  infoSection: {
    background: '#1a1a1a',
    border: '1px solid rgba(0, 200, 255, 0.15)',
    borderRadius: '12px',
    padding: '24px',
  },
  infoTitle: {
    color: '#00c8ff',
    fontSize: '16px',
    margin: '0 0 16px 0',
    fontWeight: '600' as const,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
  },
  infoLabel: {
    color: '#aaa',
    fontSize: '13px',
  },
  infoValue: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  loadingText: {
    color: '#00c8ff',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
