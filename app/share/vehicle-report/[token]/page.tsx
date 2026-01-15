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
    <div style={styles.pageContainer} className="report-page">
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
            <h1 style={styles.companyName}>AUTOW</h1>
            <h2 style={styles.subtitle}>Transport & Recovery</h2>
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
              {/* Damage markers would be overlaid here if we rendered them */}
            </div>
            {damageMarkers.length > 0 && (
              <div style={styles.damageList}>
                {damageMarkers.map((marker, idx) => (
                  <div key={idx} style={styles.damageItem}>
                    <span style={styles.damageNumber}>{marker.number}.</span>
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

        {/* Disclaimer */}
        <div style={styles.disclaimerSection}>
          <p style={styles.disclaimerText}>
            <strong>Disclaimer:</strong> The customer confirms that the condition of the vehicle has been checked and agreed. The Driver will provide a walk around Video Inspection prior to recovery or repair.
          </p>
          <div style={styles.videoField}>
            <span style={styles.fieldLabel}>Video File Code:</span>
            <span style={styles.fieldValue}>{report.video_file_code || '________________'}</span>
          </div>
          <p style={styles.insuranceText}>
            AUTOW Transport & Recovery holds Goods in Transit insurance up to £1,000,000. No liability is accepted for undisclosed pre-existing damage or mechanical failures not caused during recovery. By signing this form, the customer agrees to the terms outlined above.
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
        @media (max-width: 768px) {
          .document { padding: 15px !important; }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    fontFamily: 'Arial, sans-serif',
    background: '#f5f5f5',
    minHeight: '100vh',
    padding: '20px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  errorText: {
    fontSize: '18px',
    color: '#f44336',
  },
  actionBar: {
    maxWidth: '900px',
    margin: '0 auto 20px auto',
    display: 'flex',
    justifyContent: 'flex-end',
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
    fontSize: '11px',
  },
  damageItem: {
    marginBottom: '3px',
  },
  damageNumber: {
    fontWeight: 'bold',
    marginRight: '5px',
    color: '#f44336',
  },
  damageNote: {
    color: '#333',
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
  disclaimerText: {
    margin: '0 0 10px 0',
  },
  videoField: {
    margin: '10px 0',
    fontSize: '12px',
  },
  insuranceText: {
    margin: '10px 0',
    fontSize: '10px',
    color: '#333',
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
};
