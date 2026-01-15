'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MileageEntry {
  id: number;
  date: string;
  vehicle: string;
  start_location: string;
  destination: string;
  purpose: string;
  miles: number;
  claim_amount: number;
  created_at: string;
}

interface MileageSummary {
  totalMiles: number;
  totalClaim: number;
  first10kMiles: number;
  after10kMiles: number;
  first10kClaim: number;
  after10kClaim: number;
}

const VEHICLES = [
  { value: 'ford_ranger', label: 'Ford Ranger' },
  { value: 'recovery_truck', label: 'Recovery Truck' },
  { value: 'partner_car', label: "Partner's Car" },
];

const HMRC_RATES = {
  FIRST_10K: 0.45,
  AFTER_10K: 0.25,
  THRESHOLD: 10000,
};

export default function MileagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [summary, setSummary] = useState<MileageSummary>({
    totalMiles: 0,
    totalClaim: 0,
    first10kMiles: 0,
    after10kMiles: 0,
    first10kClaim: 0,
    after10kClaim: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle: 'ford_ranger',
    start_location: '',
    destination: '',
    purpose: '',
    miles: '',
  });

  // Postcode calculator state
  const [postcodeCalc, setPostcodeCalc] = useState({
    from: '',
    to: '',
    result: null as number | null,
    loading: false,
    error: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchMileage();
  }, [router]);

  const fetchMileage = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/mileage/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        calculateSummary(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching mileage:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (mileageEntries: MileageEntry[]) => {
    const totalMiles = mileageEntries.reduce((sum, e) => sum + parseFloat(String(e.miles)), 0);

    let first10kMiles = Math.min(totalMiles, HMRC_RATES.THRESHOLD);
    let after10kMiles = Math.max(0, totalMiles - HMRC_RATES.THRESHOLD);

    const first10kClaim = first10kMiles * HMRC_RATES.FIRST_10K;
    const after10kClaim = after10kMiles * HMRC_RATES.AFTER_10K;
    const totalClaim = first10kClaim + after10kClaim;

    setSummary({
      totalMiles,
      totalClaim,
      first10kMiles,
      after10kMiles,
      first10kClaim,
      after10kClaim,
    });
  };

  const calculateClaimForMiles = (miles: number, currentTotal: number): number => {
    const newTotal = currentTotal + miles;

    if (currentTotal >= HMRC_RATES.THRESHOLD) {
      return miles * HMRC_RATES.AFTER_10K;
    }

    if (newTotal <= HMRC_RATES.THRESHOLD) {
      return miles * HMRC_RATES.FIRST_10K;
    }

    const milesAt45p = HMRC_RATES.THRESHOLD - currentTotal;
    const milesAt25p = miles - milesAt45p;
    return (milesAt45p * HMRC_RATES.FIRST_10K) + (milesAt25p * HMRC_RATES.AFTER_10K);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.miles || parseFloat(formData.miles) <= 0) {
      alert('Please enter valid miles');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('autow_token');
      const miles = parseFloat(formData.miles);
      const claimAmount = calculateClaimForMiles(miles, summary.totalMiles);

      const response = await fetch('/api/autow/mileage/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          miles,
          claim_amount: claimAmount,
        })
      });

      if (response.ok) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          vehicle: 'ford_ranger',
          start_location: '',
          destination: '',
          purpose: '',
          miles: '',
        });
        fetchMileage();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving mileage:', error);
      alert('Failed to save mileage entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mileage entry?')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/mileage/delete?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchMileage();
      } else {
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting mileage:', error);
    }
  };

  const calculateDistance = async () => {
    if (!postcodeCalc.from || !postcodeCalc.to) {
      setPostcodeCalc(prev => ({ ...prev, error: 'Enter both postcodes' }));
      return;
    }

    setPostcodeCalc(prev => ({ ...prev, loading: true, error: '', result: null }));

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/mileage/calculate-distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          from: postcodeCalc.from,
          to: postcodeCalc.to,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPostcodeCalc(prev => ({ ...prev, result: data.miles, loading: false }));
      } else {
        const error = await response.json();
        setPostcodeCalc(prev => ({ ...prev, error: error.error || 'Calculation failed', loading: false }));
      }
    } catch (error) {
      setPostcodeCalc(prev => ({ ...prev, error: 'Failed to calculate distance', loading: false }));
    }
  };

  const useCalculatedDistance = (roundTrip: boolean = false) => {
    if (postcodeCalc.result) {
      const miles = roundTrip ? postcodeCalc.result * 2 : postcodeCalc.result;
      setFormData(prev => ({
        ...prev,
        miles: miles.toFixed(1),
        start_location: prev.start_location || postcodeCalc.from,
        destination: prev.destination || postcodeCalc.to,
      }));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getVehicleLabel = (value: string) => {
    return VEHICLES.find(v => v.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🚗 Mileage Tracking</h1>
          <p style={styles.subtitle}>Log business journeys and calculate HMRC claims</p>
        </div>
        <button onClick={() => router.push('/autow/business-hub')} style={styles.backBtn}>
          ← Back to Hub
        </button>
      </div>

      {/* Summary Stats */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{summary.totalMiles.toFixed(1)}</div>
          <div style={styles.summaryLabel}>Total Miles</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>£{summary.totalClaim.toFixed(2)}</div>
          <div style={styles.summaryLabel}>Total Claim</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{summary.first10kMiles.toFixed(1)}</div>
          <div style={styles.summaryLabel}>Miles @ 45p</div>
          <div style={styles.summarySubValue}>£{summary.first10kClaim.toFixed(2)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{summary.after10kMiles.toFixed(1)}</div>
          <div style={styles.summaryLabel}>Miles @ 25p</div>
          <div style={styles.summarySubValue}>£{summary.after10kClaim.toFixed(2)}</div>
        </div>
      </div>

      {/* Postcode Calculator */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📍 Postcode Distance Calculator</h2>
        <div style={styles.calcGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>From Postcode</label>
            <input
              type="text"
              value={postcodeCalc.from}
              onChange={(e) => setPostcodeCalc(prev => ({ ...prev, from: e.target.value.toUpperCase() }))}
              style={styles.input}
              placeholder="e.g., TR18 4QB"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>To Postcode</label>
            <input
              type="text"
              value={postcodeCalc.to}
              onChange={(e) => setPostcodeCalc(prev => ({ ...prev, to: e.target.value.toUpperCase() }))}
              style={styles.input}
              placeholder="e.g., PL1 1AA"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>&nbsp;</label>
            <button
              onClick={calculateDistance}
              style={styles.calcBtn}
              disabled={postcodeCalc.loading}
            >
              {postcodeCalc.loading ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>

        {postcodeCalc.error && (
          <div style={styles.errorText}>{postcodeCalc.error}</div>
        )}

        {postcodeCalc.result && (
          <div style={styles.calcResult}>
            <div style={styles.calcResultValue}>{postcodeCalc.result.toFixed(1)} miles</div>
            <div style={styles.calcActions}>
              <button onClick={() => useCalculatedDistance(false)} style={styles.useBtn}>
                Use Distance
              </button>
              <button onClick={() => useCalculatedDistance(true)} style={styles.useBtn}>
                Round Trip ({(postcodeCalc.result * 2).toFixed(1)} mi)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Journey Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>➕ Log Journey</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle *</label>
              <select
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                style={styles.input}
                required
              >
                {VEHICLES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Location *</label>
              <input
                type="text"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                style={styles.input}
                placeholder="e.g., Workshop, TR18 4QB"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Destination *</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                style={styles.input}
                placeholder="e.g., Customer, PL1 1AA"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Purpose</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                style={styles.input}
                placeholder="e.g., Mobile repair callout"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Miles *</label>
              <input
                type="number"
                step="0.1"
                value={formData.miles}
                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                style={styles.numberInput}
                placeholder="0.0"
                required
              />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving...' : '+ Add Journey'}
          </button>
        </form>
      </div>

      {/* Mileage Log Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 Mileage Log ({entries.length} entries)</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Purpose</th>
                <th style={styles.th}>Miles</th>
                <th style={styles.th}>Claim</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyRow}>No mileage entries yet</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={styles.td}>{formatDate(entry.date)}</td>
                    <td style={styles.td}>{getVehicleLabel(entry.vehicle)}</td>
                    <td style={styles.td}>{entry.start_location}</td>
                    <td style={styles.td}>{entry.destination}</td>
                    <td style={styles.td}>{entry.purpose || '-'}</td>
                    <td style={styles.tdMiles}>{parseFloat(String(entry.miles)).toFixed(1)}</td>
                    <td style={styles.tdClaim}>£{parseFloat(String(entry.claim_amount)).toFixed(2)}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px 24px',
    marginBottom: '20px',
    border: '1px solid rgba(0, 200, 255, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  headerLeft: {},
  title: {
    color: '#00c8ff',
    fontSize: '24px',
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: '#888',
    fontSize: '13px',
    margin: '0',
  },
  backBtn: {
    background: 'rgba(0, 200, 255, 0.1)',
    border: '1px solid rgba(0, 200, 255, 0.3)',
    color: '#00c8ff',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  summaryCard: {
    background: '#1a1a1a',
    border: '1px solid rgba(0, 200, 255, 0.15)',
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center' as const,
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700' as const,
    color: '#00c8ff',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase' as const,
    marginTop: '4px',
  },
  summarySubValue: {
    fontSize: '14px',
    color: '#30ff37',
    marginTop: '6px',
    fontWeight: '600' as const,
  },
  section: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(48, 255, 55, 0.2)',
  },
  sectionTitle: {
    color: '#30ff37',
    fontSize: '18px',
    margin: '0 0 16px 0',
  },
  calcGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    color: '#888',
    fontSize: '12px',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  input: {
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  numberInput: {
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    WebkitTextFillColor: '#fff',
    colorScheme: 'dark',
  },
  calcBtn: {
    padding: '12px 20px',
    background: 'rgba(0, 200, 255, 0.2)',
    border: '1px solid rgba(0, 200, 255, 0.4)',
    borderRadius: '6px',
    color: '#00c8ff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  calcResult: {
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  calcResultValue: {
    fontSize: '24px',
    fontWeight: '700' as const,
    color: '#30ff37',
  },
  calcActions: {
    display: 'flex',
    gap: '10px',
  },
  useBtn: {
    padding: '10px 16px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  errorText: {
    color: '#f44336',
    fontSize: '13px',
    marginTop: '8px',
  },
  submitBtn: {
    padding: '14px 28px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700' as const,
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 10px',
    background: '#0a0a0a',
    color: '#888',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    position: 'sticky' as const,
    top: 0,
  },
  td: {
    padding: '12px 10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#ccc',
  },
  tdMiles: {
    padding: '12px 10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#00c8ff',
    fontWeight: '600' as const,
  },
  tdClaim: {
    padding: '12px 10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#30ff37',
    fontWeight: '600' as const,
  },
  emptyRow: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
  deleteBtn: {
    background: 'rgba(244, 67, 54, 0.2)',
    border: '1px solid rgba(244, 67, 54, 0.4)',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loadingText: {
    color: '#00c8ff',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
