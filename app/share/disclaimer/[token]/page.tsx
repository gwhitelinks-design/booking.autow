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
      <div style={styles.container} className="mobile-full-height">
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (error && !disclaimer) {
    return (
      <div style={styles.container} className="mobile-full-height">
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>Unable to Load Disclaimer</h1>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!disclaimer) {
    return (
      <div style={styles.container} className="mobile-full-height">
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
      <div style={styles.container} className="mobile-full-height">
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
    <div style={styles.container} className="mobile-full-height">
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
    minHeight: '100dvh',
    padding: 'min(20px, 5vw)',
  },
  document: {
    maxWidth: 'min(700px, 95vw)',
    margin: '0 auto',
    background: '#fff',
    borderRadius: 'min(12px, 3vw)',
    padding: 'clamp(15px, 5vw, 40px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'min(20px, 4vw)',
    marginBottom: 'min(30px, 6vw)',
    paddingBottom: 'min(20px, 4vw)',
    borderBottom: '2px solid #30ff37',
  },
  logo: {
    width: 'clamp(60px, 15vw, 100px)',
    height: 'auto',
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
    textAlign: 'right' as const,
  },
  companyName: {
    color: '#30ff37',
    fontSize: 'clamp(0.85rem, 4.5vw, 1.5rem)',
    margin: '0 0 min(8px, 2vw) 0',
    fontWeight: 700,
  },
  contactInfo: {
    color: '#666',
    fontSize: 'clamp(0.55rem, 2.8vw, 0.85rem)',
    margin: '1px 0',
    lineHeight: 1.4,
  },
  formTitle: {
    color: '#000',
    fontSize: 'clamp(0.8rem, 4vw, 1.25rem)',
    textAlign: 'center' as const,
    margin: '0 0 min(8px, 2vw) 0',
    padding: 'min(12px, 3vw)',
    background: '#f8f8f8',
    borderRadius: 'min(8px, 2vw)',
    fontWeight: 600,
  },
  referenceNumber: {
    color: '#666',
    fontSize: 'clamp(0.6rem, 2.8vw, 0.9rem)',
    textAlign: 'center' as const,
    marginBottom: 'min(20px, 5vw)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
    gap: 'min(20px, 4vw)',
    marginBottom: 'min(30px, 6vw)',
  },
  infoBox: {
    background: '#f8f8f8',
    border: '1px solid #e0e0e0',
    borderRadius: 'min(8px, 2vw)',
    padding: 'min(15px, 4vw)',
  },
  infoLabel: {
    display: 'block',
    color: '#aaa',
    fontSize: 'clamp(0.5rem, 2.5vw, 0.75rem)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 'min(6px, 1.5vw)',
  },
  infoValue: {
    color: '#000',
    fontSize: 'clamp(0.7rem, 3.5vw, 1rem)',
    fontWeight: 'bold' as const,
    margin: '0 0 2px 0',
  },
  infoSubValue: {
    color: '#666',
    fontSize: 'clamp(0.6rem, 3vw, 0.9rem)',
    margin: '0',
  },
  section: {
    marginBottom: 'min(20px, 5vw)',
  },
  introText: {
    color: '#333',
    fontSize: 'clamp(0.65rem, 3.2vw, 0.95rem)',
    lineHeight: '1.5',
    marginBottom: 'min(15px, 4vw)',
  },
  procedureBox: {
    background: '#f8f8f8',
    border: '1px solid #e0e0e0',
    borderRadius: 'min(8px, 2vw)',
    padding: 'min(15px, 4vw)',
    marginBottom: 'min(15px, 4vw)',
  },
  procedureLabel: {
    display: 'block',
    color: '#666',
    fontSize: 'clamp(0.55rem, 2.8vw, 0.85rem)',
    marginBottom: 'min(6px, 1.5vw)',
    fontWeight: 'bold',
  },
  procedureText: {
    color: '#000',
    fontSize: 'clamp(0.7rem, 3.5vw, 1rem)',
    lineHeight: '1.5',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  authorizationText: {
    color: '#333',
    fontSize: 'clamp(0.6rem, 3vw, 0.9rem)',
    lineHeight: '1.5',
    padding: 'min(12px, 3vw)',
    background: 'rgba(48, 255, 55, 0.05)',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: 'min(8px, 2vw)',
  },
  additionalDisclaimer: {
    background: '#fff8e1',
    border: '1px solid #ffcc80',
    borderRadius: 'min(8px, 2vw)',
    padding: 'min(12px, 3vw)',
    marginBottom: 'min(15px, 4vw)',
  },
  additionalTitle: {
    color: '#e65100',
    fontSize: 'clamp(0.7rem, 3.5vw, 1rem)',
    margin: '0 0 min(8px, 2vw) 0',
    fontWeight: 600,
  },
  additionalText: {
    color: '#666',
    fontSize: 'clamp(0.6rem, 3vw, 0.9rem)',
    lineHeight: '1.5',
    margin: 0,
  },
  error: {
    background: '#ffebee',
    border: '1px solid #ef5350',
    color: '#c62828',
    padding: 'min(10px, 3vw)',
    borderRadius: 'min(8px, 2vw)',
    marginBottom: 'min(15px, 4vw)',
    fontSize: 'clamp(0.6rem, 3vw, 0.9rem)',
  },
  fieldGroup: {
    marginBottom: 'min(18px, 4vw)',
  },
  fieldLabel: {
    display: 'block',
    color: '#333',
    fontSize: 'clamp(0.65rem, 3.2vw, 0.95rem)',
    fontWeight: 'bold',
    marginBottom: 'min(6px, 1.5vw)',
  },
  fieldHint: {
    color: '#aaa',
    fontSize: 'clamp(0.55rem, 2.5vw, 0.75rem)',
    marginTop: 'min(4px, 1vw)',
  },
  input: {
    width: '100%',
    padding: 'min(12px, 3vw)',
    border: '1px solid #ddd',
    borderRadius: 'min(8px, 2vw)',
    fontSize: '16px', // Keep 16px to prevent iOS zoom
    boxSizing: 'border-box' as const,
    minHeight: '44px', // Touch target
  },
  signButton: {
    width: '100%',
    padding: 'min(14px, 3.5vw)',
    background: '#fff',
    border: '2px dashed #30ff37',
    borderRadius: 'min(8px, 2vw)',
    color: '#30ff37',
    fontSize: 'clamp(0.8rem, 4vw, 1.125rem)',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: '48px',
  },
  signaturePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 'min(10px, 3vw)',
    flexWrap: 'wrap' as const,
  },
  signaturePreviewImage: {
    maxWidth: 'min(150px, 40vw)',
    maxHeight: '60px',
    border: '1px solid #ddd',
    borderRadius: 'min(6px, 1.5vw)',
  },
  clearSignatureBtn: {
    padding: 'min(8px, 2vw) min(14px, 3.5vw)',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 'min(6px, 1.5vw)',
    color: '#666',
    cursor: 'pointer',
    fontSize: 'clamp(0.65rem, 3vw, 0.9rem)',
    minHeight: '40px',
  },
  submitButton: {
    width: '100%',
    padding: 'min(14px, 3.5vw)',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: 'min(8px, 2vw)',
    fontSize: 'clamp(0.8rem, 4vw, 1.125rem)',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 'min(10px, 2vw)',
    minHeight: '48px',
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
    padding: 'min(20px, 4vw)',
  },
  modalContent: {
    background: '#fff',
    borderRadius: 'min(16px, 4vw)',
    padding: 'clamp(15px, 5vw, 30px)',
    maxWidth: 'min(420px, 95vw)',
    width: '100%',
  },
  modalTitle: {
    color: '#000',
    margin: '0 0 5px 0',
    textAlign: 'center' as const,
    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
  },
  modalHint: {
    color: '#aaa',
    textAlign: 'center' as const,
    marginBottom: 'min(20px, 4vw)',
    fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
  },
  signatureCanvas: {
    width: '100%',
    height: 'clamp(150px, 40vw, 200px)',
    border: '1px solid #ddd',
    borderRadius: 'min(8px, 2vw)',
    touchAction: 'none',
    cursor: 'crosshair',
    background: '#fff',
  },
  modalButtons: {
    display: 'flex',
    gap: 'min(10px, 2vw)',
    marginTop: 'min(20px, 4vw)',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  cancelBtn: {
    padding: 'min(12px, 3vw) min(24px, 5vw)',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: 'min(8px, 2vw)',
    cursor: 'pointer',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
    minHeight: '44px',
  },
  clearBtn: {
    padding: 'min(12px, 3vw) min(24px, 5vw)',
    background: '#fff3e0',
    color: '#e65100',
    border: 'none',
    borderRadius: 'min(8px, 2vw)',
    cursor: 'pointer',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
    minHeight: '44px',
  },
  saveBtn: {
    padding: 'min(12px, 3vw) min(24px, 5vw)',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: 'min(8px, 2vw)',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
    minHeight: '44px',
  },
  // Success & Signed banners
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 'min(20px, 4vw)',
    padding: 'min(20px, 4vw)',
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: 'min(12px, 3vw)',
    marginBottom: 'min(30px, 6vw)',
    flexWrap: 'wrap' as const,
  },
  successIcon: {
    width: 'clamp(40px, 10vw, 50px)',
    height: 'clamp(40px, 10vw, 50px)',
    background: '#30ff37',
    color: '#000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  successTitle: {
    color: '#30ff37',
    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
    margin: '0 0 5px 0',
    fontWeight: 600,
  },
  successSubtitle: {
    color: '#666',
    fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
    margin: 0,
    wordBreak: 'break-word' as const,
  },
  signedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 'min(20px, 4vw)',
    padding: 'min(20px, 4vw)',
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: 'min(12px, 3vw)',
    marginBottom: 'min(30px, 6vw)',
    flexWrap: 'wrap' as const,
  },
  signedIcon: {
    width: 'clamp(40px, 10vw, 50px)',
    height: 'clamp(40px, 10vw, 50px)',
    background: '#30ff37',
    color: '#000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  signedTitle: {
    color: '#30ff37',
    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
    margin: '0 0 5px 0',
    fontWeight: 600,
  },
  signedSubtitle: {
    color: '#666',
    fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
    margin: 0,
    wordBreak: 'break-word' as const,
  },
  signatureDisplay: {
    marginTop: 'min(30px, 6vw)',
    paddingTop: 'min(20px, 4vw)',
    borderTop: '1px solid #e0e0e0',
  },
  signatureImage: {
    maxWidth: 'min(300px, 80vw)',
    maxHeight: '100px',
    border: '1px solid #ddd',
    borderRadius: 'min(8px, 2vw)',
    marginTop: 'min(10px, 2vw)',
  },
  // Error states
  loadingText: {
    color: '#30ff37',
    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
    textAlign: 'center' as const,
    paddingTop: 'min(100px, 20vw)',
  },
  errorContainer: {
    maxWidth: 'min(400px, 90vw)',
    margin: 'min(100px, 15vw) auto',
    textAlign: 'center' as const,
    padding: 'clamp(20px, 6vw, 40px)',
    background: '#fff',
    borderRadius: 'min(12px, 3vw)',
  },
  errorTitle: {
    color: '#c62828',
    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
    margin: '0 0 min(15px, 3vw) 0',
  },
  errorText: {
    color: '#666',
    fontSize: 'clamp(0.85rem, 3vw, 1rem)',
    margin: 0,
  },
};
