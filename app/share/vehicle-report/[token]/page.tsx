import pool from '@/lib/db';
import PrintButton from './PrintButton';

interface DamageMarker {
  id: string;
  x: number;
  y: number;
  number: number;
  note: string;
}

async function getReportData(token: string) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM vehicle_reports WHERE share_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return { report: null };
    }

    return { report: result.rows[0] };
  } finally {
    client.release();
  }
}

export default async function SharedVehicleReportPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const { report } = await getReportData(token);

  if (!report) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Report not found or link has expired</div>
      </div>
    );
  }

  const damageMarkers: DamageMarker[] = typeof report.damage_markers === 'string'
    ? JSON.parse(report.damage_markers || '[]')
    : (report.damage_markers || []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '________________';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const serviceType = report.service_type === 'recovery' ? 'Recovery' : 'Transport';

  return (
    <div style={styles.pageContainer} className="report-page mobile-full-height">
      {/* Print Button */}
      <div style={styles.actionBar} className="no-print">
        <PrintButton />
      </div>

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
                    position: 'absolute' as const,
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

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .document { box-shadow: none !important; border: none !important; }
        }

        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          .document { -webkit-text-size-adjust: 100%; }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    fontFamily: 'Arial, sans-serif',
    background: '#f5f5f5',
    minHeight: '100dvh',
    padding: 'min(20px, 5vw)',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    background: '#f5f5f5',
  },
  errorText: {
    fontSize: 'clamp(1rem, 4vw, 1.125rem)',
    color: '#f44336',
  },
  actionBar: {
    maxWidth: 'min(900px, 95vw)',
    margin: '0 auto min(20px, 4vw) auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  document: {
    maxWidth: 'min(900px, 95vw)',
    margin: '0 auto',
    background: '#fff',
    padding: 'clamp(15px, 5vw, 30px)',
    borderRadius: 'min(4px, 1vw)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #ddd',
  },
  // Header styles
  header: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'min(15px, 3vw)',
    marginBottom: 'min(20px, 4vw)',
    paddingBottom: 'min(15px, 3vw)',
    borderBottom: '2px solid #000',
  },
  logoSection: {
    flex: '0 0 auto',
    minWidth: 'clamp(80px, 18vw, 150px)',
  },
  logo: {
    width: 'clamp(80px, 18vw, 140px)',
    height: 'auto',
  },
  titleSection: {
    flex: '1 1 auto',
    textAlign: 'center' as const,
    minWidth: 'min(200px, 40vw)',
  },
  companyName: {
    fontSize: 'clamp(1rem, 5vw, 1.75rem)',
    fontWeight: 'bold',
    margin: '0',
  },
  subtitle: {
    fontSize: 'clamp(0.75rem, 3.5vw, 1.125rem)',
    fontWeight: 'bold',
    margin: 'min(5px, 1vw) 0',
  },
  phone: {
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
    fontWeight: 'bold',
    margin: 'min(5px, 1vw) 0',
  },
  contactInfo: {
    fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
    margin: '2px 0',
    color: '#333',
  },
  addressSection: {
    flex: '0 0 auto',
    textAlign: 'right' as const,
    minWidth: 'clamp(80px, 15vw, 120px)',
  },
  addressText: {
    fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
    margin: '1px 0',
    color: '#333',
  },
  // Form section styles
  formSection: {
    marginBottom: 'min(20px, 4vw)',
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'min(20px, 4vw)',
    marginBottom: 'min(8px, 2vw)',
  },
  formField: {
    flex: '1 1 min(200px, 45%)',
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: 'min(5px, 1vw)',
  },
  fieldValue: {
    borderBottom: '1px solid #999',
    paddingBottom: '2px',
  },
  fieldValueHighlight: {
    borderBottom: '1px solid #999',
    paddingBottom: '2px',
    fontWeight: 'bold',
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
  },
  // Two column section
  twoColumnSection: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'min(20px, 4vw)',
    marginBottom: 'min(20px, 4vw)',
  },
  riskColumn: {
    flex: '1 1 min(280px, 100%)',
  },
  diagramColumn: {
    flex: '1 1 min(280px, 100%)',
  },
  riskBox: {
    border: '1px solid #000',
    padding: 'min(12px, 3vw)',
    height: '100%',
  },
  riskTitle: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    fontWeight: 'bold',
    margin: '0 0 min(10px, 2vw) 0',
    background: '#000',
    color: '#fff',
    padding: 'min(4px, 1vw) min(8px, 2vw)',
    display: 'inline-block',
  },
  riskText: {
    fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
    margin: '0 0 min(10px, 2vw) 0',
    lineHeight: 1.4,
  },
  riskField: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    marginBottom: 'min(10px, 2vw)',
  },
  riskDisclaimer: {
    fontSize: 'clamp(0.5rem, 2.2vw, 0.625rem)',
    margin: 'min(10px, 2vw) 0',
    lineHeight: 1.4,
    color: '#333',
  },
  signatureField: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    marginTop: 'min(15px, 3vw)',
  },
  signatureLine: {
    borderBottom: '1px solid #000',
    display: 'inline-block',
    minWidth: 'min(200px, 50vw)',
  },
  signatureImage: {
    maxHeight: 'min(50px, 12vw)',
    maxWidth: 'min(200px, 50vw)',
    display: 'block',
    marginTop: 'min(5px, 1vw)',
  },
  diagramTitle: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    fontWeight: 'bold',
    margin: '0 0 min(10px, 2vw) 0',
    background: '#000',
    color: '#fff',
    padding: 'min(4px, 1vw) min(8px, 2vw)',
    display: 'inline-block',
  },
  diagramContainer: {
    position: 'relative' as const,
    border: '1px solid #ccc',
    background: '#fff',
    marginBottom: 'min(10px, 2vw)',
  },
  carImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  damageList: {
    background: '#fff8e1',
    border: '2px solid #f44336',
    borderRadius: 'min(8px, 2vw)',
    padding: 'min(12px, 3vw)',
    marginTop: 'min(10px, 2vw)',
  },
  damageListTitle: {
    fontSize: 'clamp(0.65rem, 3vw, 0.8rem)',
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 'min(10px, 2vw)',
    paddingBottom: 'min(8px, 2vw)',
    borderBottom: '1px solid #ffcdd2',
  },
  damageItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 'min(8px, 2vw)',
    padding: 'min(6px, 1.5vw) min(8px, 2vw)',
    background: '#fff',
    borderRadius: 'min(4px, 1vw)',
    border: '1px solid #ffcdd2',
  },
  damageNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'clamp(18px, 5vw, 22px)',
    height: 'clamp(18px, 5vw, 22px)',
    borderRadius: '50%',
    background: '#f44336',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 'clamp(0.55rem, 2.5vw, 0.75rem)',
    marginRight: 'min(10px, 2vw)',
    flexShrink: 0,
  },
  damageNote: {
    color: '#333',
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    lineHeight: 1.4,
    fontWeight: '500',
  },
  // Notes section
  notesSection: {
    border: '1px solid #000',
    padding: 'min(12px, 3vw)',
    marginBottom: 'min(20px, 4vw)',
  },
  notesTitle: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    fontWeight: 'bold',
    margin: '0 0 min(8px, 2vw) 0',
  },
  notesText: {
    fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
    minHeight: 'min(40px, 10vw)',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  // Disclaimer section
  disclaimerSection: {
    marginBottom: 'min(20px, 4vw)',
    fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
    lineHeight: 1.5,
  },
  termsTitle: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    fontWeight: 'bold',
    margin: '0 0 min(10px, 2vw) 0',
    background: '#000',
    color: '#fff',
    padding: 'min(4px, 1vw) min(8px, 2vw)',
    display: 'inline-block',
  },
  termsBox: {
    border: '1px solid #ccc',
    padding: 'min(12px, 3vw)',
    marginBottom: 'min(10px, 2vw)',
    background: '#fafafa',
  },
  termsText: {
    fontSize: 'clamp(0.5rem, 2.2vw, 0.625rem)',
    margin: '0 0 min(8px, 2vw) 0',
    lineHeight: 1.5,
    color: '#333',
  },
  videoField: {
    margin: 'min(10px, 2vw) 0',
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
  },
  agreementText: {
    margin: 'min(10px, 2vw) 0',
    fontSize: 'clamp(0.5rem, 2.2vw, 0.625rem)',
    color: '#000',
    fontWeight: 'bold',
    fontStyle: 'italic' as const,
    lineHeight: 1.5,
  },
  // Signatures section
  signaturesSection: {
    marginTop: 'min(20px, 4vw)',
  },
  signatureRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'min(40px, 8vw)',
    marginBottom: 'min(15px, 3vw)',
    alignItems: 'flex-end',
  },
  signatureBlock: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
    flex: '1 1 min(150px, 40%)',
  },
};
