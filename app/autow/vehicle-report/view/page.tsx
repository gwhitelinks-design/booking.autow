'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DamageMarker {
  id: string;
  x: number;
  y: number;
  number: number;
  note: string;
}

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        await navigator.clipboard.writeText(data.share_url);
        setNotification({ type: 'success', message: 'Share link copied to clipboard!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to generate link' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to copy link' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '________________';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Report not found</div>
        <button onClick={() => router.push('/autow/vehicle-report')} style={styles.backBtn}>
          Back to Reports
        </button>
      </div>
    );
  }

  const damageMarkers: DamageMarker[] = typeof report.damage_markers === 'string'
    ? JSON.parse(report.damage_markers || '[]')
    : (report.damage_markers || []);

  const serviceType = report.service_type === 'recovery' ? 'Recovery' : 'Transport';

  return (
    <div style={styles.pageContainer} className="report-page">
      {/* Action Bar */}
      <div style={styles.actionBar} className="no-print">
        <button onClick={() => router.push('/autow/vehicle-report')} style={styles.backBtn}>
          Back
        </button>
        <div style={styles.actionButtons}>
          {report.status === 'draft' && (
            <button onClick={() => router.push(`/autow/vehicle-report/create?edit=${report.id}`)} style={styles.editBtn}>
              Edit
            </button>
          )}
          <button onClick={() => setShowEmailModal(true)} style={styles.sendBtn}>
            Send to Customer
          </button>
          <button onClick={handleCopyShareLink} style={styles.shareBtn}>
            Copy Share Link
          </button>
          <button onClick={handlePrint} style={styles.printBtn}>
            Print
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          background: notification.type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'
        }} className="no-print">
          {notification.message}
        </div>
      )}

      {/* Document */}
      <div style={styles.document} className="document">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
          </div>
          <div style={styles.titleSection}>
            <h1 style={styles.companyName}>AUTOW Services LTD</h1>
            <h2 style={styles.subtitle}>Vehicle Repair & Recovery</h2>
            <p style={styles.phone}>Tel: 07737 006737</p>
            <p style={styles.contactInfo}>Email: info@autow-services.co.uk</p>
            <p style={styles.contactInfo}>WEB: www.autow-services.co.uk</p>
          </div>
          <div style={styles.addressSection}>
            <p style={styles.addressText}>AUTO SERVICES</p>
            <p style={styles.addressText}>Alverton</p>
            <p style={styles.addressText}>Penzance</p>
            <p style={styles.addressText}>Cornwall</p>
            <p style={styles.addressText}>TR18 4QB</p>
          </div>
        </div>

        {/* Form Fields - Two Column Layout */}
        <div style={styles.formSection}>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Repair or Recovery:</span>
              <span style={styles.fieldValue}>{serviceType}</span>
            </div>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Date:</span>
              <span style={styles.fieldValue}>{formatDate(report.report_date)}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Vehicle Registration:</span>
              <span style={styles.fieldValueHighlight}>{report.vehicle_reg || '________________'}</span>
            </div>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Time Arrival:</span>
              <span style={styles.fieldValue}>{report.time_arrival || '________'}</span>
              <span style={styles.fieldLabel}> Time Depart:</span>
              <span style={styles.fieldValue}>{report.time_depart || '________'}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Vehicle Type / Model:</span>
              <span style={styles.fieldValue}>{report.vehicle_type_model || '________________'}</span>
            </div>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Customer Name:</span>
              <span style={styles.fieldValue}>{report.customer_name || '________________'}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Vehicle Weight:</span>
              <span style={styles.fieldValue}>{report.vehicle_weight || '________________'}</span>
            </div>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Customer Address:</span>
              <span style={styles.fieldValue}>{report.customer_address || '________________'}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Pickup Location:</span>
              <span style={styles.fieldValue}>{report.pickup_location || '________________'}</span>
            </div>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Known Issues / Notes:</span>
              <span style={styles.fieldValue}>{report.known_issues || '________________'}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Delivery Location:</span>
              <span style={styles.fieldValue}>{report.delivery_location || '________________'}</span>
            </div>
            <div style={styles.formField}></div>
          </div>
        </div>

        {/* Two Column Section - Risk Procedure & Vehicle Diagram */}
        <div style={styles.twoColumnSection}>
          {/* Left Column - Risk Procedure */}
          <div style={styles.riskColumn}>
            <div style={styles.riskBox}>
              <h3 style={styles.riskTitle}>Procedures Involving Risk of Damage</h3>
              <p style={styles.riskText}>
                You have asked us to do the following, something which by its nature may cause damage to your vehicle
              </p>
              <div style={styles.riskField}>
                <span style={styles.fieldLabel}>The Following:</span>
                <span style={styles.fieldValue}>{report.risk_procedure_description || '________________'}</span>
              </div>
              <p style={styles.riskDisclaimer}>
                I hereby authorize Autow (or its agent) to carry out the above procedure(s). I understand that this carries an inherent risk of damage, And that damage may be caused to my vehicle. I agree that Autow (or its agent) cannot be held liable for any such damage.
              </p>
              <div style={styles.signatureField}>
                <span style={styles.fieldLabel}>Signature:</span>
                {report.risk_procedure_signature ? (
                  <img src={report.risk_procedure_signature} alt="Risk Signature" style={styles.signatureImage} />
                ) : (
                  <span style={styles.signatureLine}>________________________</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Vehicle Diagram */}
          <div style={styles.diagramColumn}>
            <h3 style={styles.diagramTitle}>Vehicle Condition Report &nbsp;&nbsp; Top-Down View</h3>
            <div style={styles.diagramContainer}>
              <img src="/assets/car_check.jpg" alt="Vehicle Check Diagram" style={styles.carImage} />
              {/* Damage Markers on Diagram */}
              {damageMarkers.map((marker, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#f44336',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transform: 'translate(-50%, -50%)',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 10,
                  }}
                >
                  {marker.number}
                </div>
              ))}
            </div>
            {damageMarkers.length > 0 && (
              <div style={styles.damageList}>
                <div style={styles.damageListTitle}>Damage Points:</div>
                {damageMarkers.map((marker, idx) => (
                  <div key={idx} style={styles.damageItem}>
                    <span style={styles.damageNumber}>{marker.number}</span>
                    <span style={styles.damageNote}>{marker.note || 'No description'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div style={styles.notesSection}>
          <h3 style={styles.notesTitle}>Notes:</h3>
          <p style={styles.notesText}>{report.notes || '____________________________________________________________________________'}</p>
        </div>

        {/* Disclaimer & Terms */}
        <div style={styles.disclaimerSection}>
          <h3 style={styles.termsTitle}>Terms & Conditions</h3>
          <div style={styles.termsBox}>
            <p style={styles.termsText}>
              <strong>1. Vehicle Condition:</strong> The customer confirms that the condition of the vehicle has been inspected and agreed upon prior to transport/recovery. A video inspection will be conducted by the driver before and after the service.
            </p>
            <p style={styles.termsText}>
              <strong>2. Insurance Coverage:</strong> AUTOW Services LTD holds comprehensive Goods in Transit insurance up to £1,000,000 and Public Liability insurance up to £5,000,000.
            </p>
            <p style={styles.termsText}>
              <strong>3. Limitation of Liability:</strong> We accept no liability for: (a) undisclosed pre-existing damage, (b) mechanical or electrical failures not caused during our service, (c) personal belongings left in the vehicle, (d) damage caused by incorrect information provided by the customer.
            </p>
            <p style={styles.termsText}>
              <strong>4. Customer Responsibilities:</strong> The customer must ensure all information provided is accurate, disclose any known faults or issues, and remove all valuable personal items from the vehicle.
            </p>
            <p style={styles.termsText}>
              <strong>5. Payment:</strong> Payment is due upon completion of service unless otherwise agreed in writing. We reserve the right to hold the vehicle until full payment is received.
            </p>
            <p style={styles.termsText}>
              <strong>6. Cancellation:</strong> Cancellations must be made at least 2 hours before the scheduled service. Late cancellations may incur a call-out fee.
            </p>
          </div>
          <div style={styles.videoField}>
            <span style={styles.fieldLabel}>Video File Code:</span>
            <span style={styles.fieldValue}>{report.video_file_code || '________________'}</span>
          </div>
          <p style={styles.agreementText}>
            By signing this form, I confirm that I have read, understood, and agree to the terms and conditions outlined above. I acknowledge that AUTOW Services LTD has conducted a thorough inspection of my vehicle and I accept the recorded condition as accurate.
          </p>
        </div>

        {/* Signatures */}
        <div style={styles.signaturesSection}>
          <div style={styles.signatureRow}>
            <div style={styles.signatureBlock}>
              <span style={styles.fieldLabel}>Customer Signature:</span>
              {report.customer_signature ? (
                <img src={report.customer_signature} alt="Customer Signature" style={styles.signatureImage} />
              ) : (
                <span style={styles.signatureLine}>________________________</span>
              )}
            </div>
            <div style={styles.signatureBlock}>
              <span style={styles.fieldLabel}>Date:</span>
              <span style={styles.fieldValue}>{formatDate(report.customer_signature_date)}</span>
            </div>
          </div>
          <div style={styles.signatureRow}>
            <div style={styles.signatureBlock}>
              <span style={styles.fieldLabel}>Driver Signature:</span>
              {report.driver_signature ? (
                <img src={report.driver_signature} alt="Driver Signature" style={styles.signatureImage} />
              ) : (
                <span style={styles.signatureLine}>________________________</span>
              )}
            </div>
            <div style={styles.signatureBlock}>
              <span style={styles.fieldLabel}>Date:</span>
              <span style={styles.fieldValue}>{formatDate(report.driver_signature_date)}</span>
            </div>
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
              <button onClick={() => setShowEmailModal(false)} style={styles.cancelButton} disabled={sending}>
                Cancel
              </button>
              <button onClick={handleSendEmail} style={styles.confirmSendButton} disabled={sending}>
                {sending ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .document { box-shadow: none !important; border: none !important; }
        }
        @media (max-width: 768px) {
          .document { padding: 15px !important; }
        }
      `}</style>
    </div>
  );
}

export default function ViewReportPage() {
  return (
    <Suspense fallback={
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    }>
      <ViewReportContent />
    </Suspense>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    fontFamily: 'Arial, sans-serif',
    background: '#f5f5f5',
    minHeight: '100vh',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f5f5f5',
    gap: '20px',
  },
  loadingText: {
    fontSize: '18px',
    color: '#333',
  },
  actionBar: {
    maxWidth: '900px',
    margin: '0 auto 20px auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  backBtn: {
    padding: '10px 20px',
    background: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  editBtn: {
    padding: '10px 20px',
    background: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  sendBtn: {
    padding: '10px 20px',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  shareBtn: {
    padding: '10px 20px',
    background: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  printBtn: {
    padding: '10px 20px',
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  notification: {
    position: 'fixed' as const,
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600' as const,
    zIndex: 1000,
  },
  document: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    padding: '30px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #ddd',
  },
  // Header styles
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #000',
  },
  logoSection: {
    flex: '0 0 150px',
  },
  logo: {
    width: '140px',
    height: 'auto',
  },
  titleSection: {
    flex: 1,
    textAlign: 'center' as const,
  },
  companyName: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  phone: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  contactInfo: {
    fontSize: '11px',
    margin: '2px 0',
    color: '#333',
  },
  addressSection: {
    flex: '0 0 120px',
    textAlign: 'right' as const,
  },
  addressText: {
    fontSize: '11px',
    margin: '1px 0',
    color: '#333',
  },
  // Form section styles
  formSection: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '8px',
  },
  formField: {
    flex: 1,
    fontSize: '12px',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: '5px',
  },
  fieldValue: {
    borderBottom: '1px solid #999',
    paddingBottom: '2px',
  },
  fieldValueHighlight: {
    borderBottom: '1px solid #999',
    paddingBottom: '2px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  // Two column section
  twoColumnSection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  riskColumn: {
    flex: '1',
  },
  diagramColumn: {
    flex: '1',
  },
  riskBox: {
    border: '1px solid #000',
    padding: '12px',
    height: '100%',
  },
  riskTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    background: '#000',
    color: '#fff',
    padding: '4px 8px',
    display: 'inline-block',
  },
  riskText: {
    fontSize: '11px',
    margin: '0 0 10px 0',
    lineHeight: 1.4,
  },
  riskField: {
    fontSize: '12px',
    marginBottom: '10px',
  },
  riskDisclaimer: {
    fontSize: '10px',
    margin: '10px 0',
    lineHeight: 1.4,
    color: '#333',
  },
  signatureField: {
    fontSize: '12px',
    marginTop: '15px',
  },
  signatureLine: {
    borderBottom: '1px solid #000',
    display: 'inline-block',
    minWidth: '200px',
  },
  signatureImage: {
    maxHeight: '50px',
    maxWidth: '200px',
    display: 'block',
    marginTop: '5px',
  },
  diagramTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    background: '#000',
    color: '#fff',
    padding: '4px 8px',
    display: 'inline-block',
  },
  diagramContainer: {
    position: 'relative' as const,
    border: '1px solid #ccc',
    background: '#fff',
    marginBottom: '10px',
  },
  carImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  damageList: {
    background: '#fff8e1',
    border: '2px solid #f44336',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '10px',
  },
  damageListTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #ffcdd2',
  },
  damageItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '8px',
    padding: '6px 8px',
    background: '#fff',
    borderRadius: '4px',
    border: '1px solid #ffcdd2',
  },
  damageNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#f44336',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '12px',
    marginRight: '10px',
    flexShrink: 0,
  },
  damageNote: {
    color: '#333',
    fontSize: '12px',
    lineHeight: 1.4,
    fontWeight: '500',
  },
  // Notes section
  notesSection: {
    border: '1px solid #000',
    padding: '12px',
    marginBottom: '20px',
  },
  notesTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  notesText: {
    fontSize: '11px',
    minHeight: '40px',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  // Disclaimer section
  disclaimerSection: {
    marginBottom: '20px',
    fontSize: '11px',
    lineHeight: 1.5,
  },
  termsTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    background: '#000',
    color: '#fff',
    padding: '4px 8px',
    display: 'inline-block',
  },
  termsBox: {
    border: '1px solid #ccc',
    padding: '12px',
    marginBottom: '10px',
    background: '#fafafa',
  },
  termsText: {
    fontSize: '10px',
    margin: '0 0 8px 0',
    lineHeight: 1.5,
    color: '#333',
  },
  videoField: {
    margin: '10px 0',
    fontSize: '12px',
  },
  agreementText: {
    margin: '10px 0',
    fontSize: '10px',
    color: '#000',
    fontWeight: 'bold',
    fontStyle: 'italic' as const,
    lineHeight: 1.5,
  },
  // Signatures section
  signaturesSection: {
    marginTop: '20px',
  },
  signatureRow: {
    display: 'flex',
    gap: '40px',
    marginBottom: '15px',
    alignItems: 'flex-end',
  },
  signatureBlock: {
    fontSize: '12px',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '30px',
    width: '100%',
    maxWidth: '500px',
  },
  modalTitle: {
    fontSize: '22px',
    margin: '0 0 25px 0',
    color: '#333',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    color: '#666',
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
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
    background: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  confirmSendButton: {
    padding: '12px 24px',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
};
