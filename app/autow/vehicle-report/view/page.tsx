'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface VehicleReport {
  id: number;
  report_number: string;
  report_date: string;
  service_type: string;
  vehicle_reg: string;
  vehicle_type_model: string;
  vehicle_weight: string;
  pickup_location: string;
  delivery_location: string;
  time_arrival: string;
  time_depart: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  customer_email: string;
  known_issues: string;
  risk_procedure_description: string;
  risk_procedure_signature: string;
  damage_markers: any;
  notes: string;
  video_file_code: string;
  customer_signature: string;
  customer_signature_date: string;
  driver_signature: string;
  driver_signature_date: string;
  status: string;
  email_sent_at: string;
  email_sent_to: string;
  created_at: string;
}

function ViewReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');

  const [report, setReport] = useState<VehicleReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    if (reportId) {
      fetchReport();
    }
  }, [router, reportId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/vehicle-report/get?id=${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        if (data.report.customer_email) {
          setEmailAddress(data.report.customer_email);
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      setSendStatus({ type: 'error', message: 'Please enter an email address' });
      return;
    }

    setSending(true);
    setSendStatus(null);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/vehicle-report/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: reportId,
          customerEmail: emailAddress,
          customMessage: customMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus({ type: 'success', message: `Report sent successfully to ${emailAddress}` });
        // Refresh report to show email sent status
        fetchReport();
        setTimeout(() => {
          setShowEmailModal(false);
          setSendStatus(null);
        }, 2000);
      } else {
        setSendStatus({ type: 'error', message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setSendStatus({ type: 'error', message: 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const handleCopyShareLink = async () => {
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
        setShareLink(data.share_url);
        await navigator.clipboard.writeText(data.share_url);
        setCopyStatus('Link copied to clipboard!');
        setTimeout(() => setCopyStatus(null), 3000);
      } else {
        setCopyStatus('Failed to generate link');
        setTimeout(() => setCopyStatus(null), 3000);
      }
    } catch (error) {
      setCopyStatus('Failed to copy link');
      setTimeout(() => setCopyStatus(null), 3000);
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
      <span style={{ ...styles.badge, background: style.bg, color: style.color }}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getServiceBadge = (serviceType: string) => {
    const isRecovery = serviceType === 'recovery';
    return (
      <span style={{
        ...styles.badge,
        background: isRecovery ? 'rgba(33, 150, 243, 0.2)' : 'rgba(156, 39, 176, 0.2)',
        color: isRecovery ? '#2196f3' : '#9c27b0'
      }}>
        {serviceType?.toUpperCase() || 'TRANSPORT'}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Report not found</div>
        <button onClick={() => router.push('/autow/vehicle-report')} style={styles.backButton}>
          Back to Reports
        </button>
      </div>
    );
  }

  const damageMarkers = typeof report.damage_markers === 'string'
    ? JSON.parse(report.damage_markers || '[]')
    : (report.damage_markers || []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{report.vehicle_reg}</h1>
          <p style={styles.reportNumber}>{report.report_number}</p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.badges}>
            {getServiceBadge(report.service_type)}
            {getStatusBadge(report.status)}
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => setShowEmailModal(true)}
              style={styles.sendButton}
            >
              Send to Customer
            </button>
            <button
              onClick={handleCopyShareLink}
              style={styles.copyLinkButton}
            >
              Copy Share Link
            </button>
            {report.status === 'draft' && (
              <button
                onClick={() => router.push(`/autow/vehicle-report/create?edit=${report.id}`)}
                style={styles.editButton}
              >
                Edit Report
              </button>
            )}
            <button
              onClick={() => router.push('/autow/vehicle-report')}
              style={styles.backButton}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Email Sent Notice */}
      {report.email_sent_at && (
        <div style={styles.emailSentNotice}>
          Report sent to <strong>{report.email_sent_to}</strong> on {formatDate(report.email_sent_at)}
        </div>
      )}

      {/* Copy Status Notice */}
      {copyStatus && (
        <div style={styles.copyStatusNotice}>
          {copyStatus}
          {shareLink && (
            <div style={styles.shareLinkText}>{shareLink}</div>
          )}
        </div>
      )}

      {/* Report Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Report Details</h2>
        <div style={styles.grid}>
          <div style={styles.field}>
            <span style={styles.label}>Report Date</span>
            <span style={styles.value}>{formatDate(report.report_date)}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Time Arrival</span>
            <span style={styles.value}>{report.time_arrival || 'Not set'}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Time Depart</span>
            <span style={styles.value}>{report.time_depart || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Vehicle Details</h2>
        <div style={styles.grid}>
          <div style={styles.field}>
            <span style={styles.label}>Registration</span>
            <span style={{ ...styles.value, color: '#30ff37', fontWeight: 700 }}>{report.vehicle_reg}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Type/Model</span>
            <span style={styles.value}>{report.vehicle_type_model || 'Not specified'}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Weight</span>
            <span style={styles.value}>{report.vehicle_weight || 'Not specified'}</span>
          </div>
        </div>
        <div style={styles.grid}>
          <div style={styles.field}>
            <span style={styles.label}>Pickup Location</span>
            <span style={styles.value}>{report.pickup_location || 'Not specified'}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Delivery Location</span>
            <span style={styles.value}>{report.delivery_location || 'Not specified'}</span>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Customer Details</h2>
        <div style={styles.grid}>
          <div style={styles.field}>
            <span style={styles.label}>Name</span>
            <span style={styles.value}>{report.customer_name || 'Not specified'}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Phone</span>
            <span style={styles.value}>{report.customer_phone || 'Not specified'}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{report.customer_email || 'Not specified'}</span>
          </div>
        </div>
        {report.customer_address && (
          <div style={styles.field}>
            <span style={styles.label}>Address</span>
            <span style={styles.value}>{report.customer_address}</span>
          </div>
        )}
      </div>

      {/* Known Issues */}
      {report.known_issues && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Known Issues</h2>
          <p style={styles.textContent}>{report.known_issues}</p>
        </div>
      )}

      {/* Risk Procedure */}
      {(report.risk_procedure_description || report.risk_procedure_signature) && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Risk Procedure Authorization</h2>
          {report.risk_procedure_description && (
            <p style={styles.textContent}>{report.risk_procedure_description}</p>
          )}
          {report.risk_procedure_signature && (
            <div style={styles.signatureBox}>
              <span style={styles.label}>Authorization Signature</span>
              <img src={report.risk_procedure_signature} alt="Risk Procedure Signature" style={styles.signatureImage} />
            </div>
          )}
        </div>
      )}

      {/* Damage Markers */}
      {damageMarkers.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Damage Markers</h2>
          <div style={styles.damageList}>
            {damageMarkers.map((marker: any, index: number) => (
              <div key={index} style={styles.damageItem}>
                <span style={styles.damageNumber}>{marker.number}</span>
                <span style={styles.damageNote}>{marker.note || 'No description'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Notes</h2>
          <p style={styles.textContent}>{report.notes}</p>
        </div>
      )}

      {/* Video File Code */}
      {report.video_file_code && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Video File Code</h2>
          <p style={{ ...styles.value, fontFamily: 'monospace', fontSize: '18px' }}>{report.video_file_code}</p>
        </div>
      )}

      {/* Signatures */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Signatures</h2>
        <div style={styles.signaturesGrid}>
          <div style={styles.signatureBox}>
            <span style={styles.label}>Customer Signature</span>
            {report.customer_signature ? (
              <>
                <img src={report.customer_signature} alt="Customer Signature" style={styles.signatureImage} />
                <span style={styles.signatureDate}>{formatDate(report.customer_signature_date)}</span>
              </>
            ) : (
              <span style={styles.noSignature}>Not signed</span>
            )}
          </div>
          <div style={styles.signatureBox}>
            <span style={styles.label}>Driver Signature</span>
            {report.driver_signature ? (
              <>
                <img src={report.driver_signature} alt="Driver Signature" style={styles.signatureImage} />
                <span style={styles.signatureDate}>{formatDate(report.driver_signature_date)}</span>
              </>
            ) : (
              <span style={styles.noSignature}>Not signed</span>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Send Report to Customer</h2>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Customer Email *</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Custom Message (Optional)</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal message to the customer..."
                style={styles.textarea}
                rows={4}
              />
            </div>

            {sendStatus && (
              <div style={{
                ...styles.statusMessage,
                background: sendStatus.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                color: sendStatus.type === 'success' ? '#4caf50' : '#f44336'
              }}>
                {sendStatus.message}
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={styles.cancelButton}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                style={styles.confirmSendButton}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewReportPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    }>
      <ViewReportContent />
    </Suspense>
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
  title: {
    color: '#30ff37',
    fontSize: '36px',
    margin: '0 0 5px 0',
  },
  reportNumber: {
    color: '#888',
    fontSize: '16px',
    margin: '0',
  },
  headerActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '15px',
  },
  badges: {
    display: 'flex',
    gap: '10px',
  },
  badge: {
    padding: '6px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700' as const,
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  sendButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #30ff37 0%, #20cc2a 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
  copyLinkButton: {
    padding: '12px 24px',
    background: 'rgba(33, 150, 243, 0.2)',
    color: '#2196f3',
    border: '1px solid rgba(33, 150, 243, 0.3)',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  editButton: {
    padding: '12px 24px',
    background: 'rgba(255, 152, 0, 0.2)',
    color: '#ff9800',
    border: '1px solid rgba(255, 152, 0, 0.3)',
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
  emailSentNotice: {
    background: 'rgba(76, 175, 80, 0.1)',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: '8px',
    padding: '12px 20px',
    marginBottom: '20px',
    color: '#4caf50',
    fontSize: '14px',
  },
  copyStatusNotice: {
    background: 'rgba(33, 150, 243, 0.1)',
    border: '1px solid rgba(33, 150, 243, 0.3)',
    borderRadius: '8px',
    padding: '12px 20px',
    marginBottom: '20px',
    color: '#2196f3',
    fontSize: '14px',
  },
  shareLinkText: {
    marginTop: '8px',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    wordBreak: 'break-all' as const,
  },
  section: {
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionTitle: {
    color: '#30ff37',
    fontSize: '18px',
    margin: '0 0 20px 0',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '15px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  label: {
    color: '#888',
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  value: {
    color: '#fff',
    fontSize: '16px',
  },
  textContent: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
    whiteSpace: 'pre-wrap' as const,
  },
  signaturesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  signatureBox: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  signatureImage: {
    maxWidth: '100%',
    maxHeight: '150px',
    background: '#fff',
    borderRadius: '4px',
    padding: '10px',
  },
  signatureDate: {
    color: '#888',
    fontSize: '13px',
  },
  noSignature: {
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic' as const,
    padding: '30px',
    textAlign: 'center' as const,
  },
  damageList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  damageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '12px 15px',
    borderRadius: '8px',
  },
  damageNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#f44336',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700' as const,
    fontSize: '14px',
  },
  damageNote: {
    color: '#fff',
    fontSize: '14px',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  // Modal styles
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
    maxWidth: '500px',
  },
  modalTitle: {
    color: '#30ff37',
    fontSize: '22px',
    margin: '0 0 25px 0',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    color: '#888',
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  statusMessage: {
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  modalActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  confirmSendButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #30ff37 0%, #20cc2a 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
};
