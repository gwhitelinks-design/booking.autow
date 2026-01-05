'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Static assessment data (matching the list page)
const assessments: { [key: string]: any } = {
  'HN14-UWY': {
    id: 'HN14-UWY',
    vehicle_reg: 'HN14 UWY',
    vehicle_make: 'CITROEN',
    vehicle_model: 'C3',
    vehicle_engine: '1199cc Petrol',
    vehicle_colour: 'Grey',
    assessment_date: '2026-01-03',
    recommendation: 'write-off',
    write_off_category: 'S',
    repair_cost_min: 4050,
    repair_cost_max: 7900,
    vehicle_value_min: 2500,
    vehicle_value_max: 4000,
    critical_count: 6,
    high_count: 12,
    medium_count: 20,
    low_count: 2,
    total_items: 40,
  }
};

function AssessmentViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    const id = searchParams.get('id');
    if (id && assessments[id]) {
      setAssessment(assessments[id]);
    }
    setLoading(false);
  }, [router, searchParams]);

  const handleShare = async () => {
    if (!assessment) return;
    const shareUrl = `${window.location.origin}/share/assessment/${assessment.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`Share link copied to clipboard!\n\n${shareUrl}`);
    } catch {
      prompt('Copy this share link:', shareUrl);
    }
  };

  const handleViewFullReport = () => {
    if (!assessment) return;
    window.open(`/share/assessment/${assessment.id}`, '_blank');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.errorBox}>
            <h2 style={styles.errorTitle}>Assessment Not Found</h2>
            <p style={styles.errorText}>The requested assessment could not be found.</p>
            <button onClick={() => router.push('/autow/assessments')} style={styles.backBtn}>
              Back to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Assessment Report</h1>
            <p style={styles.subtitle}>{assessment.vehicle_reg}</p>
          </div>
          <button onClick={() => router.push('/autow/assessments')} style={styles.backBtn}>
            Back to List
          </button>
        </div>

        {/* Summary Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <div style={styles.regBadge}>{assessment.vehicle_reg}</div>
            <div style={{
              ...styles.statusBadge,
              background: assessment.recommendation === 'write-off' ? '#dc2626' : '#22c55e'
            }}>
              {assessment.recommendation === 'write-off'
                ? `WRITE-OFF (Cat ${assessment.write_off_category})`
                : 'REPAIRABLE'}
            </div>
          </div>

          <div style={styles.vehicleInfo}>
            <h2 style={styles.vehicleName}>{assessment.vehicle_make} {assessment.vehicle_model}</h2>
            <p style={styles.vehicleDetails}>{assessment.vehicle_engine} | {assessment.vehicle_colour}</p>
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Assessment Date</span>
              <span style={styles.detailValue}>
                {new Date(assessment.assessment_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Estimated Repair Cost</span>
              <span style={{ ...styles.detailValue, color: '#f97316' }}>
                £{assessment.repair_cost_min.toLocaleString()} - £{assessment.repair_cost_max.toLocaleString()}
              </span>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Vehicle Value</span>
              <span style={styles.detailValue}>
                £{assessment.vehicle_value_min.toLocaleString()} - £{assessment.vehicle_value_max.toLocaleString()}
              </span>
            </div>

            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Total Damage Items</span>
              <span style={styles.detailValue}>{assessment.total_items}</span>
            </div>
          </div>

          {/* Damage Summary */}
          <div style={styles.damageSection}>
            <h3 style={styles.sectionTitle}>Damage Summary</h3>
            <div style={styles.damageCounts}>
              <div style={{ ...styles.damageBox, borderColor: '#dc2626' }}>
                <span style={{ ...styles.damageNumber, color: '#dc2626' }}>{assessment.critical_count}</span>
                <span style={styles.damageLabel}>Critical</span>
              </div>
              <div style={{ ...styles.damageBox, borderColor: '#f97316' }}>
                <span style={{ ...styles.damageNumber, color: '#f97316' }}>{assessment.high_count}</span>
                <span style={styles.damageLabel}>High</span>
              </div>
              <div style={{ ...styles.damageBox, borderColor: '#eab308' }}>
                <span style={{ ...styles.damageNumber, color: '#eab308' }}>{assessment.medium_count}</span>
                <span style={styles.damageLabel}>Medium</span>
              </div>
              <div style={{ ...styles.damageBox, borderColor: '#22c55e' }}>
                <span style={{ ...styles.damageNumber, color: '#22c55e' }}>{assessment.low_count}</span>
                <span style={styles.damageLabel}>Low</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            <button onClick={handleViewFullReport} style={styles.viewBtn}>
              View Full Report
            </button>
            <button onClick={handleShare} style={styles.shareBtn}>
              Copy Share Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentViewPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    }>
      <AssessmentViewContent />
    </Suspense>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#000',
    minHeight: '100vh',
    color: '#fff',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  title: {
    color: '#30ff37',
    fontSize: '28px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#888',
    margin: 0,
    fontSize: '18px',
  },
  backBtn: {
    padding: '12px 24px',
    background: 'transparent',
    border: '2px solid #30ff37',
    borderRadius: '8px',
    color: '#30ff37',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
  },
  summaryCard: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: '#1a1a1a',
    borderBottom: '1px solid #333',
  },
  regBadge: {
    background: '#30ff37',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1.2em',
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.9em',
    fontWeight: 700,
    color: '#fff',
  },
  vehicleInfo: {
    padding: '20px',
    borderBottom: '1px solid #222',
  },
  vehicleName: {
    fontSize: '24px',
    margin: '0 0 5px 0',
  },
  vehicleDetails: {
    color: '#888',
    margin: 0,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1px',
    background: '#222',
  },
  detailItem: {
    background: '#111',
    padding: '15px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  detailLabel: {
    color: '#888',
    fontSize: '0.85em',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '1.1em',
    fontWeight: 600,
  },
  damageSection: {
    padding: '20px',
    borderTop: '1px solid #222',
  },
  sectionTitle: {
    color: '#30ff37',
    fontSize: '16px',
    marginBottom: '15px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  damageCounts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  damageBox: {
    background: '#0a0a0a',
    border: '2px solid',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'center',
  },
  damageNumber: {
    display: 'block',
    fontSize: '2em',
    fontWeight: 700,
  },
  damageLabel: {
    color: '#888',
    fontSize: '0.8em',
    textTransform: 'uppercase',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    background: '#0a0a0a',
    borderTop: '1px solid #333',
  },
  viewBtn: {
    flex: 1,
    padding: '14px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '16px',
  },
  shareBtn: {
    flex: 1,
    padding: '14px',
    background: 'transparent',
    border: '2px solid #7c3aed',
    borderRadius: '8px',
    color: '#7c3aed',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '16px',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center',
    padding: '100px 20px',
  },
  errorBox: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  errorTitle: {
    color: '#dc2626',
    marginBottom: '10px',
  },
  errorText: {
    color: '#888',
    marginBottom: '20px',
  },
};
