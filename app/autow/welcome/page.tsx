'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('autow_token');
    router.push('/autow');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.welcomeBox} className="welcome-box">
        <div style={styles.header}>
          <img
            src="https://autow-services.co.uk/logo.png"
            alt="AUTOW"
            style={styles.logo}
          />
          <h1 style={styles.title}>Welcome to AUTOW</h1>
          <p style={styles.subtitle}>Booking Management System</p>
        </div>

        <div style={styles.optionsGrid}>
          <button
            onClick={() => router.push('/autow/booking')}
            style={styles.optionCard}
          >
            <div style={styles.optionIcon}>📅</div>
            <h2 style={styles.optionTitle}>New Booking</h2>
            <p style={styles.optionDescription}>Create a new customer booking</p>
          </button>

          <button
            onClick={() => router.push('/autow/dashboard')}
            style={styles.optionCard}
          >
            <div style={styles.optionIcon}>📊</div>
            <h2 style={styles.optionTitle}>View Dashboard</h2>
            <p style={styles.optionDescription}>Manage existing bookings</p>
          </button>

          <button
            onClick={() => router.push('/autow/estimates')}
            style={styles.optionCard}
          >
            <div style={styles.optionIcon}>📋</div>
            <h2 style={styles.optionTitle}>Estimates</h2>
            <p style={styles.optionDescription}>Create and manage estimates</p>
          </button>

          <button
            onClick={() => router.push('/autow/invoices')}
            style={styles.optionCard}
          >
            <div style={styles.optionIcon}>💰</div>
            <h2 style={styles.optionTitle}>Invoices</h2>
            <p style={styles.optionDescription}>Create and manage invoices</p>
          </button>

          <button
            onClick={() => router.push('/autow/assessments')}
            style={styles.optionCard}
          >
            <div style={styles.optionIcon}>🔍</div>
            <h2 style={styles.optionTitle}>Vehicle Assessments</h2>
            <p style={styles.optionDescription}>Damage assessment reports</p>
          </button>

          <button
            onClick={() => router.push('/autow/jotter')}
            style={{...styles.optionCard, borderColor: 'rgba(156, 39, 176, 0.4)'}}
          >
            <div style={styles.optionIcon}>✍️</div>
            <h2 style={styles.optionTitle}>Smart Jotter</h2>
            <p style={styles.optionDescription}>Handwriting to booking data</p>
          </button>

          <button
            onClick={() => router.push('/autow/notes')}
            style={{...styles.optionCard, borderColor: 'rgba(156, 39, 176, 0.4)'}}
          >
            <div style={styles.optionIcon}>📝</div>
            <h2 style={styles.optionTitle}>Jotter Notes</h2>
            <p style={styles.optionDescription}>View and manage saved notes</p>
          </button>

          <button
            onClick={() => router.push('/autow/receipts')}
            style={{...styles.optionCard, borderColor: 'rgba(255, 152, 0, 0.4)'}}
          >
            <div style={styles.optionIcon}>🧾</div>
            <h2 style={styles.optionTitle}>Receipts</h2>
            <p style={styles.optionDescription}>Upload and manage receipts</p>
          </button>

          <button
            onClick={() => router.push('/autow/business-hub')}
            style={{...styles.optionCard, borderColor: 'rgba(0, 200, 255, 0.4)'}}
          >
            <div style={styles.optionIcon}>📊</div>
            <h2 style={styles.optionTitle}>Business Hub</h2>
            <p style={styles.optionDescription}>Mileage, Expenses & Financials</p>
          </button>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          🚪 Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .welcome-box {
            padding: 20px 10px !important;
          }
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  welcomeBox: {
    maxWidth: '900px',
    width: '100%',
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(48, 255, 55, 0.25), 0 0 0 1px rgba(48, 255, 55, 0.1)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  logo: {
    width: '180px',
    height: 'auto',
    margin: '0 auto 20px',
    filter: 'drop-shadow(0 4px 12px rgba(48, 255, 55, 0.3))',
    display: 'block',
  },
  title: {
    color: '#30ff37',
    fontSize: '32px',
    marginBottom: '5px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#888',
    fontSize: '16px',
    margin: '0',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '30px',
  },
  optionCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '20px',
    padding: '40px 10px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.1)',
  },
  optionIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  optionTitle: {
    color: '#30ff37',
    fontSize: '24px',
    marginBottom: '10px',
    margin: '0 0 10px 0',
  },
  optionDescription: {
    color: '#888',
    fontSize: '14px',
    margin: '0',
  },
  logoutButton: {
    width: '100%',
    padding: '14px',
    border: '2px solid rgba(244, 67, 54, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    background: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    transition: 'all 0.3s',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
  },
};
