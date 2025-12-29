'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Estimate } from '@/lib/types';

export default function EstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    fetchEstimates();
  }, [router, statusFilter]);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('autow_token');
      const url = statusFilter === 'all'
        ? '/api/autow/estimate/list'
        : `/api/autow/estimate/list?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEstimates(data.estimates || []);
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: { bg: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' },
      sent: { bg: 'rgba(33, 150, 243, 0.2)', color: '#2196f3' },
      accepted: { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' },
      declined: { bg: 'rgba(244, 67, 54, 0.2)', color: '#f44336' },
      converted: { bg: 'rgba(48, 255, 55, 0.2)', color: '#30ff37' }
    };

    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.draft;

    return (
      <span style={{
        ...styles.statusBadge,
        background: style.bg,
        color: style.color
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading estimates...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="estimates-page">
      <div style={styles.header} className="page-header">
        <div>
          <h1 style={styles.title}>Estimates</h1>
          <p style={styles.subtitle}>Manage customer estimates and quotes</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => router.push('/autow/estimates/create')}
            style={styles.createButton}
            className="header-btn"
          >
            + New Estimate
          </button>
          <button
            onClick={() => router.push('/autow/invoices')}
            style={styles.invoicesButton}
            className="header-btn"
          >
            📄 Invoices
          </button>
          <button
            onClick={() => router.push('/autow/welcome')}
            style={styles.backButton}
            className="header-btn"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div style={styles.filterBar}>
        {['all', 'draft', 'sent', 'accepted', 'declined', 'converted'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              ...styles.filterButton,
              ...(statusFilter === status ? styles.filterButtonActive : {})
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Estimates List */}
      <div style={styles.estimatesList}>
        {estimates.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No estimates found</p>
            <button
              onClick={() => router.push('/autow/estimates/create')}
              style={styles.createButton}
            >
              Create Your First Estimate
            </button>
          </div>
        ) : (
          estimates.map((estimate) => (
            <div key={estimate.id} style={styles.estimateCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.estimateNumber}>{estimate.vehicle_reg || 'No Vehicle'}</h3>
                  <p style={styles.clientName}>{estimate.client_name}</p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  {getStatusBadge(estimate.status)}
                  <p style={styles.estimateDate}>
                    {estimate.estimate_date
                      ? new Date(estimate.estimate_date).toLocaleDateString('en-GB')
                      : 'No date'}
                  </p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Total:</span>
                  <span style={styles.value}>£{parseFloat(estimate.total.toString()).toFixed(2)}</span>
                </div>
                {estimate.vehicle_reg && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Vehicle:</span>
                    <span style={styles.value}>{estimate.vehicle_reg}</span>
                  </div>
                )}
                {estimate.client_phone && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Phone:</span>
                    <span style={styles.value}>{estimate.client_phone}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => router.push(`/autow/estimates/view?id=${estimate.id}`)}
                  style={styles.actionButton}
                >
                  View
                </button>
                <button
                  onClick={() => router.push(`/autow/estimates/edit?id=${estimate.id}`)}
                  style={styles.actionButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => generateShareLink(estimate.id!)}
                  style={{ ...styles.actionButton, ...styles.shareButton }}
                >
                  Share Link
                </button>
                <button
                  onClick={() => convertToInvoice(estimate.id!)}
                  style={{ ...styles.actionButton, ...styles.convertButton }}
                >
                  Convert to Invoice
                </button>
                <button
                  onClick={() => deleteEstimate(estimate.id!)}
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .page-header > div:last-child {
            width: 100%;
          }

          .header-btn {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );

  async function convertToInvoice(estimateId: number) {
    if (!confirm('Convert this estimate to an invoice?')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/estimate/convert-to-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estimate_id: estimateId })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Estimate converted to invoice successfully!');
        router.push(`/autow/invoices/view?id=${data.invoice.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error converting estimate:', error);
      alert('Failed to convert estimate');
    }
  }

  async function generateShareLink(estimateId: number) {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/estimate/generate-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estimate_id: estimateId })
      });

      if (response.ok) {
        const data = await response.json();

        // Copy to clipboard
        navigator.clipboard.writeText(data.share_url);
        alert(`Share link copied to clipboard!\n\n${data.share_url}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    }
  }

  async function deleteEstimate(estimateId: number) {
    if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/estimate/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: estimateId })
      });

      if (response.ok) {
        alert('Estimate deleted successfully');
        fetchEstimates(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting estimate:', error);
      alert('Failed to delete estimate');
    }
  }
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  title: {
    color: '#30ff37',
    fontSize: '36px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#888',
    fontSize: '16px',
    margin: '0',
  },
  createButton: {
    padding: '12px 24px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
  invoicesButton: {
    padding: '12px 24px',
    background: 'rgba(33, 150, 243, 0.2)',
    color: '#2196f3',
    border: '1px solid rgba(33, 150, 243, 0.4)',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  backButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#888',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  filterButtonActive: {
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    borderColor: '#30ff37',
  },
  estimatesList: {
    display: 'grid',
    gap: '20px',
  },
  estimateCard: {
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    padding: '24px 10px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  estimateNumber: {
    color: '#30ff37',
    fontSize: '20px',
    margin: '0 0 5px 0',
    fontWeight: '700' as const,
  },
  clientName: {
    color: '#fff',
    fontSize: '16px',
    margin: '0',
  },
  estimateDate: {
    color: '#888',
    fontSize: '14px',
    margin: '10px 0 0 0',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700' as const,
    display: 'inline-block',
  },
  cardBody: {
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  label: {
    color: '#888',
    fontSize: '14px',
  },
  value: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    padding: '8px 16px',
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  convertButton: {
    background: 'rgba(33, 150, 243, 0.1)',
    color: '#2196f3',
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  shareButton: {
    background: 'rgba(255, 193, 7, 0.1)',
    color: '#ffc107',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  deleteButton: {
    background: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyText: {
    color: '#888',
    fontSize: '18px',
    marginBottom: '20px',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
