'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/lib/types';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    fetchInvoices();
  }, [router, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('autow_token');
      const url = statusFilter === 'all'
        ? '/api/autow/invoice/list'
        : `/api/autow/invoice/list?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' },
      paid: { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' },
      overdue: { bg: 'rgba(244, 67, 54, 0.2)', color: '#f44336' },
      cancelled: { bg: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }
    };

    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;

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

  const markAsPaid = async (invoiceId: number) => {
    if (!confirm('Mark this invoice as paid?')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/mark-as-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: invoiceId })
      });

      if (response.ok) {
        alert('Invoice marked as paid!');
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark invoice as paid');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading invoices...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="invoices-page">
      <div style={styles.header} className="page-header">
        <div>
          <h1 style={styles.title}>Invoices</h1>
          <p style={styles.subtitle}>Manage customer invoices and payments</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => router.push('/autow/invoices/create')}
            style={styles.createButton}
          >
            + New Invoice
          </button>
          <button
            onClick={() => router.push('/autow/welcome')}
            style={styles.backButton}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div style={styles.filterBar}>
        {['all', 'pending', 'paid', 'overdue', 'cancelled'].map(status => (
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

      {/* Invoices List */}
      <div style={styles.invoicesList}>
        {invoices.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No invoices found</p>
            <button
              onClick={() => router.push('/autow/invoices/create')}
              style={styles.createButton}
            >
              Create Your First Invoice
            </button>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} style={styles.invoiceCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.invoiceNumber}>{invoice.invoice_number}</h3>
                  <p style={styles.clientName}>{invoice.client_name}</p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  {getStatusBadge(invoice.status)}
                  <p style={styles.invoiceDate}>
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Total:</span>
                  <span style={styles.totalAmount}>£{invoice.total.toFixed(2)}</span>
                </div>
                {invoice.balance_due > 0 && invoice.status !== 'paid' && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Balance Due:</span>
                    <span style={styles.balanceDue}>£{invoice.balance_due.toFixed(2)}</span>
                  </div>
                )}
                {invoice.vehicle_reg && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Vehicle:</span>
                    <span style={styles.value}>{invoice.vehicle_reg}</span>
                  </div>
                )}
                {invoice.client_phone && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Phone:</span>
                    <span style={styles.value}>{invoice.client_phone}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => router.push(`/autow/invoices/view?id=${invoice.id}`)}
                  style={styles.actionButton}
                >
                  View
                </button>
                <button
                  onClick={() => router.push(`/autow/invoices/edit?id=${invoice.id}`)}
                  style={styles.actionButton}
                >
                  Edit
                </button>
                {invoice.status === 'pending' && (
                  <button
                    onClick={() => markAsPaid(invoice.id!)}
                    style={{ ...styles.actionButton, ...styles.paidButton }}
                  >
                    Mark as Paid
                  </button>
                )}
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
  invoicesList: {
    display: 'grid',
    gap: '20px',
  },
  invoiceCard: {
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
  invoiceNumber: {
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
  invoiceDate: {
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
  totalAmount: {
    color: '#30ff37',
    fontSize: '18px',
    fontWeight: '700' as const,
  },
  balanceDue: {
    color: '#ffc107',
    fontSize: '16px',
    fontWeight: '700' as const,
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
  paidButton: {
    background: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    borderColor: 'rgba(76, 175, 80, 0.3)',
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
