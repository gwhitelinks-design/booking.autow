'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Static assessment data (will be replaced with database later)
const assessments = [
  {
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
];

export default function AssessmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleView = (id: string) => {
    router.push(`/autow/assessments/view?id=${id}`);
  };

  const handleShare = async (id: string) => {
    const shareUrl = `${window.location.origin}/share/assessment/${id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`Share link copied to clipboard!\n\n${shareUrl}`);
    } catch {
      prompt('Copy this share link:', shareUrl);
    }
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
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Vehicle Assessments</h1>
            <p style={styles.subtitle}>Damage assessment reports</p>
          </div>
          <div style={styles.headerButtons}>
            <button
              onClick={() => router.push('/autow/assessments/create')}
              style={styles.createBtn}
            >
              + New Assessment
            </button>
            <button
              onClick={() => router.push('/autow/welcome')}
              style={styles.backBtn}
            >
              Back to Menu
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{assessments.length}</div>
            <div style={styles.statLabel}>Total Assessments</div>
          </div>
          <div style={{ ...styles.statBox, borderColor: '#dc2626' }}>
            <div style={{ ...styles.statNumber, color: '#dc2626' }}>
              {assessments.filter(a => a.recommendation === 'write-off').length}
            </div>
            <div style={styles.statLabel}>Write-Offs</div>
          </div>
          <div style={{ ...styles.statBox, borderColor: '#22c55e' }}>
            <div style={{ ...styles.statNumber, color: '#22c55e' }}>
              {assessments.filter(a => a.recommendation === 'repair').length}
            </div>
            <div style={styles.statLabel}>Repairable</div>
          </div>
        </div>

        {/* Assessments List */}
        <div style={styles.listContainer}>
          {assessments.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No assessments yet</p>
              <button
                onClick={() => router.push('/autow/assessments/create')}
                style={styles.createBtn}
              >
                Create First Assessment
              </button>
            </div>
          ) : (
            assessments.map((assessment) => (
              <div key={assessment.id} style={styles.card}>
                <div style={styles.cardHeader}>
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

                <div style={styles.cardBody}>
                  <div style={styles.vehicleInfo}>
                    <strong>{assessment.vehicle_make} {assessment.vehicle_model}</strong>
                    <span style={styles.vehicleDetails}>
                      {assessment.vehicle_engine} | {assessment.vehicle_colour}
                    </span>
                  </div>

                  <div style={styles.assessmentDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Assessment Date:</span>
                      <span>{new Date(assessment.assessment_date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Est. Repair Cost:</span>
                      <span style={{ color: '#f97316', fontWeight: 600 }}>
                        £{assessment.repair_cost_min.toLocaleString()} - £{assessment.repair_cost_max.toLocaleString()}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Vehicle Value:</span>
                      <span>£{assessment.vehicle_value_min.toLocaleString()} - £{assessment.vehicle_value_max.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={styles.damageSummary}>
                    <span style={{ ...styles.damageCount, background: '#dc2626' }}>{assessment.critical_count} Critical</span>
                    <span style={{ ...styles.damageCount, background: '#f97316' }}>{assessment.high_count} High</span>
                    <span style={{ ...styles.damageCount, background: '#eab308', color: '#000' }}>{assessment.medium_count} Med</span>
                    <span style={{ ...styles.damageCount, background: '#22c55e' }}>{assessment.low_count} Low</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button onClick={() => handleView(assessment.id)} style={styles.viewBtn}>
                    View Report
                  </button>
                  <button onClick={() => handleShare(assessment.id)} style={styles.shareBtn}>
                    Share Link
                  </button>
                </div>
              </div>
            ))
          )}
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
    color: '#fff',
  },
  content: {
    maxWidth: '1200px',
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
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
  },
  createBtn: {
    padding: '12px 24px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '30px',
  },
  statBox: {
    background: '#111',
    border: '2px solid #30ff37',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2.5em',
    fontWeight: 700,
    color: '#30ff37',
  },
  statLabel: {
    color: '#888',
    fontSize: '0.85em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#888',
  },
  card: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  cardHeader: {
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
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1.1em',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8em',
    fontWeight: 700,
    color: '#fff',
  },
  cardBody: {
    padding: '20px',
  },
  vehicleInfo: {
    marginBottom: '15px',
  },
  vehicleDetails: {
    color: '#888',
    marginLeft: '10px',
    fontSize: '0.9em',
  },
  assessmentDetails: {
    marginBottom: '15px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #222',
  },
  detailLabel: {
    color: '#888',
  },
  damageSummary: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  damageCount: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75em',
    fontWeight: 600,
    color: '#fff',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    background: '#0a0a0a',
    borderTop: '1px solid #333',
  },
  viewBtn: {
    flex: 1,
    padding: '12px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
  },
  shareBtn: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: '2px solid #7c3aed',
    borderRadius: '8px',
    color: '#7c3aed',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center',
    padding: '100px 20px',
  },
};
