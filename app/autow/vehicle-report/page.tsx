'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VehicleReport {
  id: number;
  report_number: string;
  report_date: string;
  service_type: string;
  vehicle_reg: string;
  vehicle_type_model: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at: string;
}

export default function VehicleReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendReportId, setSendReportId] = useState<number | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchReports();
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('autow_token');
      const url = statusFilter === 'all'
        ? '/api/autow/vehicle-report/list'
        : `/api/autow/vehicle-report/list?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCustomer = (reportId: number, customerEmail?: string) => {
    setSendReportId(reportId);
    setSendEmail(customerEmail || '');
    setSendMessage('');
    setShowSendModal(true);
  };

  const handleSendEmail = async () => {
    if (!sendEmail || !sendReportId) {
      setNotification({ type: 'error', message: 'Please enter an email address' });
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/vehicle-report/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: sendReportId,
          customerEmail: sendEmail,
          customMessage: sendMessage
        })
      });

      const data = await response.json();
      if (response.ok) {
        setNotification({ type: 'success', message: `Report sent to ${sendEmail}` });
        setShowSendModal(false);
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to send' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async (reportId: number) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/vehicle-report/generate-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ report_id: reportId })
      });

      const data = await response.json();
      if (response.ok) {
        await navigator.clipboard.writeText(data.share_url);
        setNotification({ type: 'success', message: 'Share link copied to clipboard!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to generate link' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to copy link' });
    }
  };

  const handleDeleteClick = (reportId: number) => {
    setDeleteReportId(reportId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteReportId) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/vehicle-report/delete?id=${deleteReportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Report deleted successfully' });
        setShowDeleteModal(false);
        fetchReports(); // Refresh the list
        setTimeout(() => setNotification(null), 3000);
      } else {
        const data = await response.json();
        setNotification({ type: 'error', message: data.error || 'Failed to delete' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete report' });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: { bg: string; color: string } } = {
      draft: { bg: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' },
      completed: { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' },
      archived: { bg: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }
    };

    const style = statusStyles[status] || statusStyles.draft;

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

  const getServiceBadge = (serviceType: string) => {
    const isRecovery = serviceType === 'recovery';
    return (
      <span style={{
        ...styles.serviceBadge,
        background: isRecovery ? 'rgba(33, 150, 243, 0.2)' : 'rgba(156, 39, 176, 0.2)',
        color: isRecovery ? '#2196f3' : '#9c27b0'
      }}>
        {serviceType.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading reports...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>CallOut & Recovery</h1>
          <p style={styles.subtitle}>Transport & recovery job reports</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => router.push('/autow/vehicle-report/create')}
            style={styles.createButton}
          >
            + New Report
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
        {['all', 'draft', 'completed', 'archived'].map(status => (
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

      {/* Reports List */}
      <div style={styles.reportsList}>
        {reports.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No vehicle reports found</p>
            <button
              onClick={() => router.push('/autow/vehicle-report/create')}
              style={styles.createButton}
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} style={styles.reportCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.vehicleReg}>{report.vehicle_reg}</h3>
                  <p style={styles.reportNumber}>{report.report_number}</p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={styles.badges}>
                    {getServiceBadge(report.service_type)}
                    {getStatusBadge(report.status)}
                  </div>
                  <p style={styles.reportDate}>
                    {report.report_date
                      ? new Date(report.report_date).toLocaleDateString('en-GB')
                      : 'No date'}
                  </p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Customer:</span>
                  <span style={styles.value}>{report.customer_name}</span>
                </div>
                {report.vehicle_type_model && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Vehicle:</span>
                    <span style={styles.value}>{report.vehicle_type_model}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardActions}>
                <div className="actions-dropdown-container" style={styles.actionsContainer}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === report.id ? null : report.id);
                    }}
                    style={styles.actionsButton}
                  >
                    ⋮
                  </button>
                  {openActionMenu === report.id && (
                    <div style={styles.actionsDropdown}>
                      <button
                        onClick={() => {
                          router.push(`/autow/vehicle-report/view?id=${report.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        👁️ View Vehicle
                      </button>
                      <button
                        onClick={() => {
                          handleSendToCustomer(report.id, report.customer_email);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        📧 Send to Customer
                      </button>
                      <button
                        onClick={() => {
                          handleCopyLink(report.id);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        🔗 Copy Share Link
                      </button>
                      <div style={styles.menuDivider} />
                      <button
                        onClick={() => {
                          router.push(`/autow/invoices/create?vehicle_report_id=${report.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        📄 Create Invoice
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/autow/estimates/create?vehicle_report_id=${report.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        📋 Create Estimate
                      </button>
                      <div style={styles.menuDivider} />
                      <button
                        onClick={() => {
                          router.push(`/autow/vehicle-report/create?edit=${report.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        ✏️ Edit
                      </button>
                      <div style={styles.menuDivider} />
                      <button
                        onClick={() => {
                          handleDeleteClick(report.id);
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

      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          background: notification.type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSendModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Send Report to Customer</h2>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Email Address *</label>
              <input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="customer@example.com"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Custom Message (Optional)</label>
              <textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Add a personal message..."
                style={styles.textarea}
                rows={3}
              />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowSendModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleSendEmail} style={styles.confirmBtn} disabled={sending}>
                {sending ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Delete Report</h2>
            <p style={styles.deleteWarning}>
              Are you sure you want to delete this vehicle report? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} style={styles.deleteBtnConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  reportsList: {
    display: 'grid',
    gap: '20px',
  },
  reportCard: {
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  vehicleReg: {
    color: '#30ff37',
    fontSize: '22px',
    margin: '0 0 5px 0',
    fontWeight: '700' as const,
  },
  reportNumber: {
    color: '#888',
    fontSize: '14px',
    margin: '0',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  serviceBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  reportDate: {
    color: '#888',
    fontSize: '14px',
    margin: '0',
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
    bottom: '100%',
    right: 0,
    marginBottom: '4px',
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
  editButton: {
    background: 'rgba(255, 152, 0, 0.1)',
    color: '#ff9800',
    borderColor: 'rgba(255, 152, 0, 0.3)',
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
  sendButton: {
    padding: '8px 12px',
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  shareLinkButton: {
    padding: '8px 12px',
    background: 'rgba(33, 150, 243, 0.2)',
    color: '#2196f3',
    border: '1px solid rgba(33, 150, 243, 0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 12px',
    background: 'rgba(244, 67, 54, 0.2)',
    color: '#f44336',
    border: '1px solid rgba(244, 67, 54, 0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  deleteWarning: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  deleteBtnConfirm: {
    padding: '10px 20px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600' as const,
  },
  notification: {
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600' as const,
    zIndex: 1000,
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
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '16px',
    padding: '30px',
    width: '100%',
    maxWidth: '450px',
  },
  modalTitle: {
    color: '#30ff37',
    fontSize: '20px',
    margin: '0 0 20px 0',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formLabel: {
    display: 'block',
    color: '#888',
    fontSize: '13px',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelBtn: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #30ff37 0%, #20cc2a 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
};
