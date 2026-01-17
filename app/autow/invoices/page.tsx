'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/lib/types';

interface JobCostPreview {
  invoice: {
    id: number;
    invoice_number: string;
    client_name: string;
    vehicle_reg: string;
    total: number;
    vat: number;
    net: number;
    status: string;
  };
  costs: {
    parts: { total: number; count: number; items: any[] };
    mileage: { total: number; count: number; items: any[] };
    totalCosts: number;
  };
  profit: {
    amount: number;
    margin: number;
  };
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showJobDoneModal, setShowJobDoneModal] = useState(false);
  const [jobCostPreview, setJobCostPreview] = useState<JobCostPreview | null>(null);
  const [processingJobComplete, setProcessingJobComplete] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    fetchInvoices();
  }, [router, statusFilter]);

  // Click outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openActionMenu !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('.actions-dropdown-container')) {
          setOpenActionMenu(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenu]);

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

  const getStatusBadge = (status: string, profit?: number | string | null) => {
    const statusStyles = {
      pending: { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' },
      paid: { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' },
      completed: { bg: 'rgba(156, 39, 176, 0.2)', color: '#9c27b0' },
      overdue: { bg: 'rgba(244, 67, 54, 0.2)', color: '#f44336' },
      cancelled: { bg: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }
    };

    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <span style={{
          ...styles.statusBadge,
          background: style.bg,
          color: style.color
        }}>
          {status.toUpperCase()}
        </span>
        {status === 'completed' && profit !== undefined && profit !== null && (
          <span style={{
            fontSize: '12px',
            color: parseFloat(String(profit)) >= 0 ? '#4caf50' : '#f44336',
            fontWeight: '600',
          }}>
            Profit: £{parseFloat(String(profit)).toFixed(2)}
          </span>
        )}
      </div>
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

  const markAsUnpaid = async (invoiceId: number) => {
    if (!confirm('Mark this invoice as unpaid? This will also delete the invoice folder and PDF from Google Drive.')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/mark-as-unpaid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: invoiceId })
      });

      if (response.ok) {
        alert('Invoice marked as unpaid. Google Drive folder deleted.');
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error marking invoice as unpaid:', error);
      alert('Failed to mark invoice as unpaid');
    }
  };

  const generateShareLink = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/generate-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoice_id: invoiceId })
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
  };

  const deleteInvoice = async (invoiceId: number) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: invoiceId })
      });

      if (response.ok) {
        alert('Invoice deleted successfully');
        fetchInvoices(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const openJobDoneModal = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/invoice/complete?invoiceId=${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobCostPreview(data);
        setShowJobDoneModal(true);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error fetching job costs:', error);
      alert('Failed to load job costs');
    }
  };

  const confirmJobComplete = async () => {
    if (!jobCostPreview) return;

    setProcessingJobComplete(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoiceId: jobCostPreview.invoice.id })
      });

      if (response.ok) {
        setShowJobDoneModal(false);
        setJobCostPreview(null);
        alert('Job marked as complete!');
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error completing job:', error);
      alert('Failed to complete job');
    } finally {
      setProcessingJobComplete(false);
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
            className="header-btn"
          >
            + New Invoice
          </button>
          <button
            onClick={() => router.push('/autow/estimates')}
            style={styles.estimatesButton}
            className="header-btn"
          >
            📋 Estimates
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
        {['all', 'pending', 'paid', 'completed', 'overdue', 'cancelled'].map(status => (
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
                  <h3 style={styles.invoiceNumber}>{invoice.vehicle_reg || 'No Vehicle'}</h3>
                  <p style={styles.clientName}>{invoice.client_name}</p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  {getStatusBadge(invoice.status, (invoice as any).profit)}
                  <p style={styles.invoiceDate}>
                    {invoice.invoice_date
                      ? new Date(invoice.invoice_date).toLocaleDateString('en-GB')
                      : 'No date'}
                  </p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Total:</span>
                  <span style={styles.totalAmount}>£{parseFloat(invoice.total.toString()).toFixed(2)}</span>
                </div>
                {parseFloat(invoice.balance_due.toString()) > 0 && invoice.status !== 'paid' && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Balance Due:</span>
                    <span style={styles.balanceDue}>£{parseFloat(invoice.balance_due.toString()).toFixed(2)}</span>
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
                <div className="actions-dropdown-container" style={styles.actionsContainer}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === invoice.id ? null : invoice.id!);
                    }}
                    style={styles.actionsButton}
                  >
                    ⋮
                  </button>
                  {openActionMenu === invoice.id && (
                    <div style={styles.actionsDropdown}>
                      <button
                        onClick={() => {
                          router.push(`/autow/invoices/view?id=${invoice.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/autow/invoices/edit?id=${invoice.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          generateShareLink(invoice.id!);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        🔗 Share Link
                      </button>
                      {invoice.status === 'pending' && (
                        <>
                          <div style={styles.menuDivider} />
                          <button
                            onClick={() => {
                              markAsPaid(invoice.id!);
                              setOpenActionMenu(null);
                            }}
                            style={styles.actionMenuItemSuccess}
                          >
                            ✅ Mark as Paid
                          </button>
                        </>
                      )}
                      {invoice.status === 'paid' && (
                        <>
                          <div style={styles.menuDivider} />
                          <button
                            onClick={() => {
                              markAsUnpaid(invoice.id!);
                              setOpenActionMenu(null);
                            }}
                            style={styles.actionMenuItemWarning}
                          >
                            ↩️ Mark as Unpaid
                          </button>
                          <button
                            onClick={() => {
                              openJobDoneModal(invoice.id!);
                              setOpenActionMenu(null);
                            }}
                            style={styles.actionMenuItemPurple}
                          >
                            🏁 Job Done
                          </button>
                        </>
                      )}
                      <div style={styles.menuDivider} />
                      <button
                        onClick={() => {
                          deleteInvoice(invoice.id!);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItemDanger}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Done Modal */}
      {showJobDoneModal && jobCostPreview && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Complete Job</h2>
            <p style={styles.modalSubtitle}>
              {jobCostPreview.invoice.invoice_number} - {jobCostPreview.invoice.client_name}
            </p>

            <div style={styles.modalSection}>
              <div style={styles.modalRow}>
                <span>Invoice Net:</span>
                <span style={{ color: '#30ff37', fontWeight: '700' }}>
                  £{jobCostPreview.invoice.net.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>Costs</h4>
              <div style={styles.modalRow}>
                <span>Parts Receipts ({jobCostPreview.costs.parts.count}):</span>
                <span style={{ color: '#f44336' }}>
                  -£{jobCostPreview.costs.parts.total.toFixed(2)}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span>Mileage ({jobCostPreview.costs.mileage.count} trips):</span>
                <span style={{ color: '#f44336' }}>
                  -£{jobCostPreview.costs.mileage.total.toFixed(2)}
                </span>
              </div>
              <div style={{ ...styles.modalRow, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                <span style={{ fontWeight: '600' }}>Total Costs:</span>
                <span style={{ color: '#f44336', fontWeight: '600' }}>
                  -£{jobCostPreview.costs.totalCosts.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ ...styles.modalSection, background: 'rgba(48, 255, 55, 0.1)', padding: '15px', borderRadius: '8px' }}>
              <div style={styles.modalRow}>
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Profit:</span>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: jobCostPreview.profit.amount >= 0 ? '#4caf50' : '#f44336'
                }}>
                  £{jobCostPreview.profit.amount.toFixed(2)}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={{ color: '#888' }}>Profit Margin:</span>
                <span style={{
                  color: jobCostPreview.profit.margin >= 0 ? '#4caf50' : '#f44336',
                  fontWeight: '600'
                }}>
                  {jobCostPreview.profit.margin.toFixed(1)}%
                </span>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowJobDoneModal(false);
                  setJobCostPreview(null);
                }}
                style={styles.cancelButton}
                disabled={processingJobComplete}
              >
                Cancel
              </button>
              <button
                onClick={confirmJobComplete}
                style={styles.confirmButton}
                disabled={processingJobComplete}
              >
                {processingJobComplete ? 'Processing...' : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
  estimatesButton: {
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
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    position: 'relative' as const,
  },
  actionsButton: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
  },
  actionsDropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '4px',
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '8px',
    padding: '8px 0',
    minWidth: '180px',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  actionMenuItem: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  actionMenuItemSuccess: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#4caf50',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  actionMenuItemWarning: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#ff9800',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  actionMenuItemPurple: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#9c27b0',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  actionMenuItemDanger: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#f44336',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  menuDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '8px 0',
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
  unpaidButton: {
    background: 'rgba(255, 152, 0, 0.1)',
    color: '#ff9800',
    borderColor: 'rgba(255, 152, 0, 0.3)',
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
  jobDoneButton: {
    background: 'rgba(156, 39, 176, 0.1)',
    color: '#9c27b0',
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    border: '1px solid rgba(48, 255, 55, 0.3)',
  },
  modalTitle: {
    color: '#30ff37',
    fontSize: '24px',
    margin: '0 0 5px 0',
  },
  modalSubtitle: {
    color: '#888',
    fontSize: '16px',
    margin: '0 0 25px 0',
  },
  modalSection: {
    marginBottom: '20px',
  },
  modalSectionTitle: {
    color: '#fff',
    fontSize: '14px',
    margin: '0 0 10px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  modalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    color: '#fff',
    fontSize: '15px',
  },
  modalActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '25px',
  },
  cancelButton: {
    flex: 1,
    padding: '14px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  confirmButton: {
    flex: 1,
    padding: '14px 20px',
    background: '#9c27b0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
};
