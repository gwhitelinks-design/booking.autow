'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EditDisclaimerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerNumber, setDisclaimerNumber] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    if (!id) {
      router.push('/autow/disclaimers');
      return;
    }

    fetchDisclaimer();
  }, [router, id]);

  const fetchDisclaimer = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/disclaimer/get?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disclaimer');
      }

      const data = await response.json();
      const disclaimer = data.disclaimer;

      setDisclaimerNumber(disclaimer.disclaimer_number);
      setStatus(disclaimer.status);
      setCustomerName(disclaimer.customer_name || '');
      setCustomerAddress(disclaimer.customer_address || '');
      setVehicleReg(disclaimer.vehicle_reg || '');
      setVehicleMake(disclaimer.vehicle_make || '');
      setVehicleModel(disclaimer.vehicle_model || '');
      setProcedureDescription(disclaimer.procedure_description || '');
      setIncludeExistingParts(disclaimer.include_existing_parts_disclaimer || false);
      setIncludeDiagnosticPayment(disclaimer.include_diagnostic_payment_disclaimer || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!procedureDescription.trim()) {
      setError('Procedure description is required');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/disclaimer/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: parseInt(id!),
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
        throw new Error(data.error || 'Failed to update disclaimer');
      }

      router.push('/autow/disclaimers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading disclaimer...</div>
      </div>
    );
  }

  const isSigned = status === 'signed';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push('/autow/disclaimers')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Edit Disclaimer</h1>
        <span style={{
          ...styles.statusBadge,
          ...(isSigned ? styles.statusSigned : styles.statusPending),
        }}>
          {isSigned ? 'Signed' : 'Pending'}
        </span>
      </div>

      {isSigned && (
        <div style={styles.warningBox}>
          This disclaimer has already been signed. Changes will not affect the signed copy.
        </div>
      )}

      <p style={styles.referenceNumber}>Reference: {disclaimerNumber}</p>

      {error && <div style={styles.error}>{error}</div>}

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

        {/* Submit Button */}
        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={() => router.push('/autow/disclaimers')}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.submitButton,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
    marginBottom: '15px',
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
    flex: 1,
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  statusPending: {
    background: 'rgba(255, 152, 0, 0.2)',
    color: '#ff9800',
  },
  statusSigned: {
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
  },
  referenceNumber: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '20px',
  },
  warningBox: {
    background: 'rgba(255, 152, 0, 0.1)',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    color: '#ff9800',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  error: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid #ff4444',
    color: '#ff4444',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
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
  buttonRow: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
  },
  cancelButton: {
    flex: 1,
    padding: '18px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  submitButton: {
    flex: 2,
    padding: '18px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
    paddingTop: '100px',
  },
};
