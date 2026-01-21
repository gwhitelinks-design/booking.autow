'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface DisclaimerData {
  id: number;
  disclaimer_number: string;
  procedure_description: string;
  include_existing_parts_disclaimer: boolean;
  include_diagnostic_payment_disclaimer: boolean;
  status: 'pending' | 'signed';
  customer_name?: string;
  customer_address?: string;
  customer_email?: string;
  customer_signature?: string;
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  signed_at?: string;
}

export default function SignDisclaimerPage() {
  const params = useParams();
  const token = params.token as string;

  const [disclaimer, setDisclaimer] = useState<DisclaimerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Signature canvas
  const [signatureModal, setSignatureModal] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchDisclaimer();
  }, [token]);

  const fetchDisclaimer = async () => {
    try {
      const response = await fetch(`/api/share/disclaimer/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load disclaimer');
      }

      setDisclaimer(data.disclaimer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Canvas functions
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    if (signatureModal) {
      setTimeout(initCanvas, 100);
    }
  }, [signatureModal]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initCanvas();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignature(dataUrl);
    setSignatureModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!signature) {
      setError('Please provide your signature');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/share/disclaimer/${token}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_email: email,
          customer_signature: signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit signature');
      }

      setSuccess(true);
      setDisclaimer(data.disclaimer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (error && !disclaimer) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>Unable to Load Disclaimer</h1>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!disclaimer) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>Disclaimer Not Found</h1>
          <p style={styles.errorText}>This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // Already signed view
  if (disclaimer.status === 'signed') {
    return (
      <div style={styles.container}>
        <div style={styles.document}>
          {/* Header */}
          <div style={styles.header}>
            <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
            <div style={styles.headerInfo}>
              <h1 style={styles.companyName}>AUTOW Services</h1>
              <p style={styles.contactInfo}>Email: info@autow-services.co.uk</p>
              <p style={styles.contactInfo}>Alverton, Penzance, TR18 4QB</p>
              <p style={styles.contactInfo}>Phone: 07352968276</p>
            </div>
          </div>

          <div style={styles.signedBanner}>
            <span style={styles.signedIcon}>✓</span>
            <div>
              <h2 style={styles.signedTitle}>Disclaimer Signed</h2>
              <p style={styles.signedSubtitle}>
                Signed by {disclaimer.customer_email} on {formatDate(disclaimer.signed_at!)}
              </p>
            </div>
          </div>

          <h2 style={styles.formTitle}>DISCLAIMER NOTICE</h2>
          <p style={styles.referenceNumber}>Reference: {disclaimer.disclaimer_number}</p>

          {/* Customer & Vehicle Info */}
          {(disclaimer.customer_name || disclaimer.vehicle_reg) && (
            <div style={styles.infoGrid}>
              {(disclaimer.customer_name || disclaimer.customer_address) && (
                <div style={styles.infoBox}>
                  <label style={styles.infoLabel}>Customer</label>
                  {disclaimer.customer_name && <p style={styles.infoValue}>{disclaimer.customer_name}</p>}
                  {disclaimer.customer_address && <p style={styles.infoSubValue}>{disclaimer.customer_address}</p>}
                </div>
              )}
              {(disclaimer.vehicle_reg || disclaimer.vehicle_make) && (
                <div style={styles.infoBox}>
                  <label style={styles.infoLabel}>Vehicle</label>
                  {disclaimer.vehicle_reg && <p style={styles.infoValue}>{disclaimer.vehicle_reg}</p>}
                  {(disclaimer.vehicle_make || disclaimer.vehicle_model) && (
                    <p style={styles.infoSubValue}>
                      {[disclaimer.vehicle_make, disclaimer.vehicle_model].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={styles.section}>
            <p style={styles.introText}>
              You have asked us to do the following, something which by its nature may cause damage to your vehicle.
            </p>

            <div style={styles.procedureBox}>
              <label style={styles.procedureLabel}>Procedure:</label>
              <p style={styles.procedureText}>{disclaimer.procedure_description}</p>
            </div>
          </div>

          {/* Show signature */}
          {disclaimer.customer_signature && (
            <div style={styles.signatureDisplay}>
              <label style={styles.procedureLabel}>Customer Signature:</label>
              <img src={disclaimer.customer_signature} alt="Signature" style={styles.signatureImage} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Signing form view
  return (
    <div style={styles.container}>
      <div style={styles.document}>
        {/* Header */}
        <div style={styles.header}>
          <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
          <div style={styles.headerInfo}>
            <h1 style={styles.companyName}>AUTOW Services</h1>
            <p style={styles.contactInfo}>Email: info@autow-services.co.uk</p>
            <p style={styles.contactInfo}>Alverton, Penzance, TR18 4QB</p>
            <p style={styles.contactInfo}>Phone: 07352968276</p>
            <p style={styles.contactInfo}>www.autow-services.co.uk</p>
          </div>
        </div>

        <h2 style={styles.formTitle}>DISCLAIMER NOTICE</h2>
        <p style={styles.referenceNumber}>Reference: {disclaimer.disclaimer_number}</p>

        {/* Customer & Vehicle Info */}
        {(disclaimer.customer_name || disclaimer.vehicle_reg) && (
          <div style={styles.infoGrid}>
            {(disclaimer.customer_name || disclaimer.customer_address) && (
              <div style={styles.infoBox}>
                <label style={styles.infoLabel}>Customer</label>
                {disclaimer.customer_name && <p style={styles.infoValue}>{disclaimer.customer_name}</p>}
                {disclaimer.customer_address && <p style={styles.infoSubValue}>{disclaimer.customer_address}</p>}
              </div>
            )}
            {(disclaimer.vehicle_reg || disclaimer.vehicle_make) && (
              <div style={styles.infoBox}>
                <label style={styles.infoLabel}>Vehicle</label>
                {disclaimer.vehicle_reg && <p style={styles.infoValue}>{disclaimer.vehicle_reg}</p>}
                {(disclaimer.vehicle_make || disclaimer.vehicle_model) && (
                  <p style={styles.infoSubValue}>
                    {[disclaimer.vehicle_make, disclaimer.vehicle_model].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {success ? (
          <div style={styles.successBanner}>
            <span style={styles.successIcon}>✓</span>
            <div>
              <h2 style={styles.successTitle}>Thank You!</h2>
              <p style={styles.successSubtitle}>
                Your signature has been recorded. A confirmation email has been sent to {email}.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.section}>
              <p style={styles.introText}>
                You have asked us to do the following, something which by its nature may cause damage to your vehicle.
              </p>

              <div style={styles.procedureBox}>
                <label style={styles.procedureLabel}>The Following:</label>
                <p style={styles.procedureText}>{disclaimer.procedure_description}</p>
              </div>

              <p style={styles.authorizationText}>
                I hereby authorize Autow (or its agent) to carry out the above procedure(s). I understand that this carries an inherent risk of damage, and that damage may be caused to my vehicle. I agree that Autow (or its agent) cannot be held liable for any such damage.
              </p>
            </div>

            {/* Additional Disclaimers */}
            {disclaimer.include_existing_parts_disclaimer && (
              <div style={styles.additionalDisclaimer}>
                <h3 style={styles.additionalTitle}>Using Existing Parts</h3>
                <p style={styles.additionalText}>
                  I have been advised that using existing parts carries additional risk. I understand that while AUTOW Services will exercise due care, they cannot guarantee the condition or performance of parts that have not been supplied new. I accept this risk and agree that AUTOW Services shall not be held liable for any failure or damage arising from the use of existing parts.
                </p>
              </div>
            )}

            {disclaimer.include_diagnostic_payment_disclaimer && (
              <div style={styles.additionalDisclaimer}>
                <h3 style={styles.additionalTitle}>Diagnostic Payment</h3>
                <p style={styles.additionalText}>
                  I understand that diagnostic work requires time and expertise. Should I decide not to proceed with repairs following the diagnostic assessment, I agree to pay for the diagnostic time at the quoted or standard rate. This payment is due regardless of whether repair work is subsequently carried out.
                </p>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            {/* Email Field */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Your Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={styles.input}
                required
              />
              <p style={styles.fieldHint}>
                A confirmation will be sent to this email address
              </p>
            </div>

            {/* Signature */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Your Signature *</label>
              {signature ? (
                <div style={styles.signaturePreview}>
                  <img src={signature} alt="Your Signature" style={styles.signaturePreviewImage} />
                  <button
                    type="button"
                    onClick={() => setSignature(null)}
                    style={styles.clearSignatureBtn}
                  >
                    Clear & Re-sign
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSignatureModal(true)}
                  style={styles.signButton}
                >
                  Tap to Sign
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !signature}
              style={{
                ...styles.submitButton,
                opacity: submitting || !email || !signature ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Signature'}
            </button>
          </form>
        )}
      </div>

      {/* Signature Modal */}
      {signatureModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Sign Below</h3>
            <p style={styles.modalHint}>Draw your signature in the box</p>
            <canvas
              ref={canvasRef}
              width={350}
              height={200}
              style={styles.signatureCanvas}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div style={styles.modalButtons}>
              <button onClick={() => setSignatureModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={clearSignature} style={styles.clearBtn}>
                Clear
              </button>
              <button onClick={saveSignature} style={styles.saveBtn}>
                Save Signature
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
    background: '#f5f5f5',
    minHeight: '100vh',
    padding: '20px',
  },
  document: {
    maxWidth: '700px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #30ff37',
  },
  logo: {
    width: '100px',
    height: 'auto',
  },
  headerInfo: {
    flex: 1,
  },
  companyName: {
    color: '#30ff37',
    fontSize: '24px',
    margin: '0 0 10px 0',
  },
  contactInfo: {
    color: '#666',
    fontSize: '13px',
    margin: '2px 0',
  },
  formTitle: {
    color: '#000',
    fontSize: '20px',
    textAlign: 'center' as const,
    margin: '0 0 10px 0',
    padding: '15px',
    background: '#f8f8f8',
    borderRadius: '8px',
  },
  referenceNumber: {
    color: '#666',
    fontSize: '14px',
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  infoBox: {
    background: '#f8f8f8',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
  },
  infoLabel: {
    display: 'block',
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  infoValue: {
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
  },
  infoSubValue: {
    color: '#666',
    fontSize: '14px',
    margin: '0',
  },
  section: {
    marginBottom: '30px',
  },
  introText: {
    color: '#333',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  procedureBox: {
    background: '#f8f8f8',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  procedureLabel: {
    display: 'block',
    color: '#666',
    fontSize: '13px',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  procedureText: {
    color: '#000',
    fontSize: '16px',
    lineHeight: '1.5',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  authorizationText: {
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '20px',
    background: 'rgba(48, 255, 55, 0.05)',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '8px',
  },
  additionalDisclaimer: {
    background: '#fff8e1',
    border: '1px solid #ffcc80',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  additionalTitle: {
    color: '#e65100',
    fontSize: '16px',
    margin: '0 0 10px 0',
  },
  additionalText: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: 0,
  },
  error: {
    background: '#ffebee',
    border: '1px solid #ef5350',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  fieldGroup: {
    marginBottom: '25px',
  },
  fieldLabel: {
    display: 'block',
    color: '#333',
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  fieldHint: {
    color: '#888',
    fontSize: '12px',
    marginTop: '5px',
  },
  input: {
    width: '100%',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  signButton: {
    width: '100%',
    padding: '20px',
    background: '#fff',
    border: '2px dashed #30ff37',
    borderRadius: '8px',
    color: '#30ff37',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  signaturePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  signaturePreviewImage: {
    maxWidth: '200px',
    maxHeight: '80px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  clearSignatureBtn: {
    padding: '10px 20px',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    color: '#666',
    cursor: 'pointer',
  },
  submitButton: {
    width: '100%',
    padding: '18px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
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
  modalContent: {
    background: '#fff',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '420px',
    width: '100%',
  },
  modalTitle: {
    color: '#000',
    margin: '0 0 5px 0',
    textAlign: 'center' as const,
  },
  modalHint: {
    color: '#888',
    textAlign: 'center' as const,
    marginBottom: '20px',
    fontSize: '14px',
  },
  signatureCanvas: {
    width: '100%',
    height: '200px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    touchAction: 'none',
    cursor: 'crosshair',
    background: '#fff',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    justifyContent: 'center',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '12px 24px',
    background: '#fff3e0',
    color: '#e65100',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '12px 24px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  // Success & Signed banners
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  successIcon: {
    width: '50px',
    height: '50px',
    background: '#30ff37',
    color: '#000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  successTitle: {
    color: '#30ff37',
    fontSize: '20px',
    margin: '0 0 5px 0',
  },
  successSubtitle: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
  signedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  signedIcon: {
    width: '50px',
    height: '50px',
    background: '#30ff37',
    color: '#000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  signedTitle: {
    color: '#30ff37',
    fontSize: '20px',
    margin: '0 0 5px 0',
  },
  signedSubtitle: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
  signatureDisplay: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
  },
  signatureImage: {
    maxWidth: '300px',
    maxHeight: '100px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginTop: '10px',
  },
  // Error states
  loadingText: {
    color: '#30ff37',
    fontSize: '20px',
    textAlign: 'center' as const,
    paddingTop: '100px',
  },
  errorContainer: {
    maxWidth: '400px',
    margin: '100px auto',
    textAlign: 'center' as const,
    padding: '40px',
    background: '#fff',
    borderRadius: '12px',
  },
  errorTitle: {
    color: '#c62828',
    fontSize: '24px',
    margin: '0 0 15px 0',
  },
  errorText: {
    color: '#666',
    fontSize: '16px',
    margin: 0,
  },
};
