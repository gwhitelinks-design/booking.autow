'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateDisclaimerPage() {
  const router = useRouter();

  // Customer & Vehicle fields
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // Procedure & Disclaimers
  const [procedureDescription, setProcedureDescription] = useState('');
  const [includeExistingParts, setIncludeExistingParts] = useState(false);
  const [includeDiagnosticPayment, setIncludeDiagnosticPayment] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ disclaimerNumber: string; shareUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!procedureDescription.trim()) {
      setError('Procedure description is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/disclaimer/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          procedure_description: procedureDescription,
          include_existing_parts_disclaimer: includeExistingParts,
          include_diagnostic_payment_disclaimer: includeDiagnosticPayment,
          customer_name: customerName,
          customer_address: customerAddress,
          vehicle_reg: vehicleReg,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create disclaimer');
      }

      setSuccess({
        disclaimerNumber: data.disclaimer.disclaimer_number,
        shareUrl: data.disclaimer.share_url,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (success?.shareUrl) {
      try {
        await navigator.clipboard.writeText(success.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setCustomerName('');
    setCustomerAddress('');
    setVehicleReg('');
    setVehicleMake('');
    setVehicleModel('');
    setProcedureDescription('');
    setIncludeExistingParts(false);
    setIncludeDiagnosticPayment(false);
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Disclaimer Created!</h1>
          <p style={styles.successSubtitle}>
            Reference: <strong style={{ color: '#30ff37' }}>{success.disclaimerNumber}</strong>
          </p>

          <div style={styles.shareLinkBox}>
            <label style={styles.shareLinkLabel}>Share this link with your customer:</label>
            <div style={styles.shareLinkWrapper}>
              <input
                type="text"
                value={success.shareUrl}
                readOnly
                style={styles.shareLinkInput}
              />
              <button onClick={copyShareLink} style={styles.copyButton}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={styles.successActions}>
            <button
              onClick={() => window.open(success.shareUrl, '_blank')}
              style={styles.viewButton}
            >
              View as Customer
            </button>
            <button
              onClick={() => router.push('/autow/disclaimers')}
              style={styles.viewAllButton}
            >
              View All Disclaimers
            </button>
            <button onClick={resetForm} style={styles.createAnotherButton}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push('/autow/disclaimers')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Create Disclaimer</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Preview Box */}
      <div style={styles.previewBox}>
        <div style={styles.previewHeader}>
          <img src="https://autow-services.co.uk/logo.png" alt="AUTOW" style={styles.previewLogo} />
          <div style={styles.previewInfo}>
            <h3 style={styles.previewTitle}>AUTOW Services</h3>
            <p style={styles.previewText}>Alverton, Penzance, TR18 4QB</p>
            <p style={styles.previewText}>info@autow-services.co.uk | 07352968276</p>
          </div>
        </div>
        <h2 style={styles.previewFormTitle}>DISCLAIMER NOTICE</h2>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Customer Information */}
        <div style={styles.section}>
          <label style={styles.label}>Customer Information</label>
          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Customer Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Address"
              style={styles.input}
            />
          </div>
        </div>

        {/* Vehicle Information */}
        <div style={styles.section}>
          <label style={styles.label}>Vehicle Information</label>
          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Registration</label>
              <input
                type="text"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                placeholder="AB12 CDE"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Make</label>
              <input
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="e.g., Ford"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Model</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g., Focus"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Procedure Description */}
        <div style={styles.section}>
          <label style={styles.label}>
            Procedure Description <span style={styles.required}>*</span>
          </label>
          <p style={styles.hint}>
            Describe the procedure that carries a risk of damage
          </p>
          <textarea
            value={procedureDescription}
            onChange={(e) => setProcedureDescription(e.target.value)}
            placeholder="e.g., Removal of seized wheel bolts..."
            style={styles.textarea}
            rows={4}
          />
        </div>

        {/* Optional Disclaimers */}
        <div style={styles.section}>
          <label style={styles.label}>Additional Disclaimers (Optional)</label>
          <p style={styles.hint}>Select any additional disclaimers to include</p>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeExistingParts}
                onChange={(e) => setIncludeExistingParts(e.target.checked)}
                style={styles.checkbox}
              />
              <div style={styles.checkboxContent}>
                <strong style={styles.checkboxTitle}>Using Existing Parts</strong>
                <p style={styles.checkboxDescription}>
                  Customer accepts risk that existing parts may not perform as new parts
                </p>
              </div>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeDiagnosticPayment}
                onChange={(e) => setIncludeDiagnosticPayment(e.target.checked)}
                style={styles.checkbox}
              />
              <div style={styles.checkboxContent}>
                <strong style={styles.checkboxTitle}>Diagnostic Payment</strong>
                <p style={styles.checkboxDescription}>
                  Customer agrees to pay for diagnostic time if they choose not to proceed with repairs
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Authorization Preview */}
        <div style={styles.authorizationPreview}>
          <p style={styles.authorizationText}>
            <strong>Authorization Statement (shown to customer):</strong>
          </p>
          <p style={styles.authorizationContent}>
            &quot;I hereby authorize Autow (or its agent) to carry out the above procedure(s). I understand that this carries an inherent risk of damage, and that damage may be caused to my vehicle. I agree that Autow (or its agent) cannot be held liable for any such damage.&quot;
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitButton,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Disclaimer & Get Share Link'}
        </button>
      </form>
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
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  backButton: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    color: '#30ff37',
    fontSize: '28px',
    margin: '0',
  },
  error: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid #ff4444',
    color: '#ff4444',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  previewBox: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    maxWidth: '700px',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333',
  },
  previewLogo: {
    width: '80px',
    height: 'auto',
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    color: '#30ff37',
    fontSize: '18px',
    margin: '0 0 5px 0',
  },
  previewText: {
    color: '#888',
    fontSize: '13px',
    margin: '2px 0',
  },
  previewFormTitle: {
    color: '#fff',
    fontSize: '16px',
    margin: '0',
    textAlign: 'center' as const,
    padding: '10px',
    background: 'rgba(48, 255, 55, 0.1)',
    borderRadius: '8px',
  },
  form: {
    maxWidth: '700px',
  },
  section: {
    marginBottom: '30px',
  },
  label: {
    display: 'block',
    color: '#30ff37',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  required: {
    color: '#ff4444',
  },
  hint: {
    color: '#888',
    fontSize: '13px',
    margin: '-10px 0 10px 0',
  },
  fieldRow: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap' as const,
  },
  field: {
    flex: '1 1 200px',
    marginBottom: '15px',
  },
  fieldLabel: {
    display: 'block',
    color: '#888',
    fontSize: '13px',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '15px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '15px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '24px',
    height: '24px',
    accentColor: '#30ff37',
    marginTop: '2px',
    flexShrink: 0,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxTitle: {
    color: '#fff',
    fontSize: '15px',
    display: 'block',
    marginBottom: '5px',
  },
  checkboxDescription: {
    color: '#888',
    fontSize: '13px',
    margin: 0,
    lineHeight: '1.4',
  },
  authorizationPreview: {
    background: 'rgba(255, 152, 0, 0.1)',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '30px',
  },
  authorizationText: {
    color: '#ff9800',
    fontSize: '13px',
    margin: '0 0 10px 0',
  },
  authorizationContent: {
    color: '#ccc',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: 0,
    fontStyle: 'italic' as const,
  },
  submitButton: {
    width: '100%',
    padding: '18px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  // Success styles
  successContainer: {
    maxWidth: '500px',
    margin: '60px auto',
    textAlign: 'center' as const,
    padding: '40px',
    background: '#1a1a1a',
    borderRadius: '16px',
    border: '1px solid rgba(48, 255, 55, 0.3)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    margin: '0 auto 20px',
  },
  successTitle: {
    color: '#30ff37',
    fontSize: '28px',
    margin: '0 0 10px 0',
  },
  successSubtitle: {
    color: '#888',
    fontSize: '16px',
    margin: '0 0 30px 0',
  },
  shareLinkBox: {
    marginBottom: '30px',
    textAlign: 'left' as const,
  },
  shareLinkLabel: {
    display: 'block',
    color: '#888',
    fontSize: '14px',
    marginBottom: '10px',
  },
  shareLinkWrapper: {
    display: 'flex',
    gap: '10px',
  },
  shareLinkInput: {
    flex: 1,
    padding: '12px',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#30ff37',
    fontSize: '13px',
  },
  copyButton: {
    padding: '12px 20px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
  },
  successActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  viewButton: {
    padding: '15px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  viewAllButton: {
    padding: '15px',
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  createAnotherButton: {
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};
