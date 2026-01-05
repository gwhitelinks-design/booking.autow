'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DamageAssessment, DamageItem, CostEstimate, CriticalIssue } from '@/lib/types';

export default function SharedAssessmentPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<DamageAssessment | null>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchSharedAssessment();
    }
  }, [token]);

  const fetchSharedAssessment = async () => {
    try {
      const response = await fetch(`/api/share/assessment/${token}`);

      if (response.ok) {
        const data = await response.json();
        setAssessment(data.assessment);
        setBusinessSettings(data.business_settings);
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.details || 'Assessment not found or link has expired');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to load assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading assessment...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorText}>{error || 'Assessment not found'}</div>
      </div>
    );
  }

  // Parse JSON fields if they're strings
  const criticalIssues: CriticalIssue[] = typeof assessment.critical_issues === 'string'
    ? JSON.parse(assessment.critical_issues)
    : assessment.critical_issues || [];

  const damageItems: DamageItem[] = typeof assessment.damage_items === 'string'
    ? JSON.parse(assessment.damage_items)
    : assessment.damage_items || [];

  const costEstimates: CostEstimate[] = typeof assessment.cost_estimates === 'string'
    ? JSON.parse(assessment.cost_estimates)
    : assessment.cost_estimates || [];

  // Group damage items by section
  const groupedItems: { [key: string]: DamageItem[] } = {};
  damageItems.forEach(item => {
    if (!groupedItems[item.section]) {
      groupedItems[item.section] = [];
    }
    groupedItems[item.section].push(item);
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={styles.container}>
      {/* Print Button */}
      <div style={styles.actionBar} className="no-print">
        <button onClick={handlePrint} style={styles.printBtn}>
          Print / Save as PDF
        </button>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <img src="/latest2.png" alt="AUTOW Services" style={styles.logo} />
            <div style={styles.headerText}>
              <h1 style={styles.headerTitle}>Vehicle Damage Assessment</h1>
              <p style={styles.headerSubtitle}>Professional Inspection Report</p>
            </div>
          </div>
          <div style={styles.vehicleBadge}>{assessment.vehicle_reg}</div>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Make</div>
            <div style={styles.infoValue}>{assessment.vehicle_make || 'N/A'}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Engine</div>
            <div style={styles.infoValue}>{assessment.vehicle_engine || 'N/A'}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Colour</div>
            <div style={styles.infoValue}>{assessment.vehicle_colour || 'N/A'}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>First Registered</div>
            <div style={styles.infoValue}>
              {assessment.vehicle_first_registered
                ? formatDate(assessment.vehicle_first_registered)
                : 'N/A'}
            </div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>MOT Status</div>
            <div style={{ ...styles.infoValue, color: '#30ff37' }}>
              {assessment.vehicle_mot_status || 'N/A'}
            </div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Assessment Date</div>
            <div style={styles.infoValue}>{formatDate(assessment.assessment_date)}</div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalIssues.length > 0 && (
        <div style={styles.alertBanner}>
          <div style={styles.alertIcon}>!</div>
          <div style={styles.alertContent}>
            <h3 style={styles.alertTitle}>CRITICAL: Multiple Safety Issues - Vehicle NOT Roadworthy</h3>
            {criticalIssues.map((issue, index) => (
              <p key={index} style={styles.alertText}>
                <strong>{index + 1}. {issue.title}:</strong> {issue.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Video Banner */}
      {assessment.video_url && (
        <div style={styles.videoBanner}>
          <div style={{ fontSize: '2em' }}>Video</div>
          <div>
            <strong>Video Assessment Available</strong><br />
            Full walkthrough with verbal assessment:{' '}
            <a href={assessment.video_url} target="_blank" rel="noopener noreferrer" style={styles.videoLink}>
              Watch on YouTube
            </a>
          </div>
        </div>
      )}

      {/* Severity Summary */}
      <div style={styles.glassCard}>
        <div style={styles.sectionHeader}>
          <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>Stats</div>
          <div style={styles.sectionTitle}>Damage Severity Summary</div>
        </div>

        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderColor: '#dc2626', background: 'rgba(220, 38, 38, 0.05)' }}>
            <div style={{ ...styles.statNumber, color: '#dc2626' }}>{assessment.critical_count}</div>
            <div style={styles.statLabel}>Critical</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#f97316', background: 'rgba(249, 115, 22, 0.05)' }}>
            <div style={{ ...styles.statNumber, color: '#f97316' }}>{assessment.high_count}</div>
            <div style={styles.statLabel}>High</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#eab308', background: 'rgba(234, 179, 8, 0.05)' }}>
            <div style={{ ...styles.statNumber, color: '#eab308' }}>{assessment.medium_count}</div>
            <div style={styles.statLabel}>Medium</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#22c55e', background: 'rgba(34, 197, 94, 0.05)' }}>
            <div style={{ ...styles.statNumber, color: '#22c55e' }}>{assessment.low_count}</div>
            <div style={styles.statLabel}>Low</div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '10px' }}>
          <strong>Total Items: {assessment.total_items}</strong> | Based on {assessment.photo_count} photographs + video assessment
        </p>
      </div>

      {/* Damage Items by Section */}
      {Object.entries(groupedItems).map(([section, items]) => (
        <div key={section} style={styles.glassCard}>
          <div style={styles.sectionHeader}>
            <div style={{
              ...styles.sectionIcon,
              background: items.some(i => i.priority === 'critical')
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #f97316, #ea580c)'
            }}>
              {section.charAt(0)}
            </div>
            <div style={styles.sectionTitle}>{section}</div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' }}>Component</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Damage Description</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Assessment</th>
                <th style={styles.th}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  style={item.priority === 'critical' ? { background: 'rgba(220, 38, 38, 0.05)' } : {}}
                >
                  <td style={styles.td}><strong>{item.component}</strong></td>
                  <td style={styles.td}>{item.damage}</td>
                  <td style={styles.td}>{item.assessment}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={{
                      ...styles.priorityBadge,
                      ...(item.priority === 'critical' ? styles.priorityCritical :
                          item.priority === 'high' ? styles.priorityHigh :
                          item.priority === 'medium' ? styles.priorityMedium :
                          styles.priorityLow)
                    }}>
                      {item.priority.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Insurance Assessment */}
      {costEstimates.length > 0 && (
        <div style={{ ...styles.glassCard, border: '2px solid #7c3aed' }}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>Cost</div>
            <div style={styles.sectionTitle}>Insurance Claim Assessment - Economic Evaluation</div>
          </div>

          <p style={styles.purposeBox}>
            <strong>Purpose:</strong> To determine if repair costs exceed vehicle market value, which would classify this as an insurance write-off (Category B, S, or N depending on structural damage severity).
          </p>

          <h4 style={{ margin: '20px 0 15px', color: '#1a1a2e' }}>Estimated Repair Costs</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' }}>Repair Category</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Components</th>
                <th style={styles.th}>Est. Parts</th>
                <th style={styles.th}>Est. Labour</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {costEstimates.map((cost, index) => (
                <tr
                  key={index}
                  style={cost.category.toLowerCase().includes('structural') || cost.category.toLowerCase().includes('engine') || cost.category.toLowerCase().includes('cooling')
                    ? { background: 'rgba(220, 38, 38, 0.05)' }
                    : {}
                  }
                >
                  <td style={styles.td}><strong>{cost.category}</strong></td>
                  <td style={styles.td}>{cost.components}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {cost.parts_min > 0 || cost.parts_max > 0
                      ? `£${cost.parts_min.toLocaleString()} - £${cost.parts_max.toLocaleString()}`
                      : '-'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    £{cost.labour_min.toLocaleString()} - £{cost.labour_max.toLocaleString()}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <strong>£{cost.subtotal_min.toLocaleString()} - £{cost.subtotal_max.toLocaleString()}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1a1a1a', color: 'white' }}>
                <td colSpan={4} style={{ textAlign: 'right', padding: '15px' }}>
                  <strong>TOTAL ESTIMATED REPAIR COST:</strong>
                </td>
                <td style={{ padding: '15px', color: '#30ff37', textAlign: 'center' }}>
                  <strong>£{assessment.repair_cost_min.toLocaleString()} - £{assessment.repair_cost_max.toLocaleString()}</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Value vs Cost Comparison */}
          <div style={styles.comparisonGrid}>
            <div style={styles.valueBox}>
              <h4 style={{ color: '#92400e', marginBottom: '15px' }}>Vehicle Market Value</h4>
              <p style={{ color: '#78350f', marginBottom: '10px' }}>
                <strong>Vehicle:</strong> {assessment.vehicle_first_registered ? new Date(assessment.vehicle_first_registered).getFullYear() : ''} {assessment.vehicle_make} {assessment.vehicle_model} {assessment.vehicle_engine}
              </p>
              <p style={{ fontSize: '1.4em', fontWeight: 700, color: '#92400e', marginTop: '15px' }}>
                Est. Value: £{assessment.vehicle_value_min.toLocaleString()} - £{assessment.vehicle_value_max.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.85em', color: '#a16207', marginTop: '5px' }}>Based on typical UK market values</p>
            </div>

            <div style={styles.assessmentBox}>
              <h4 style={{ color: '#991b1b', marginBottom: '15px' }}>Economic Assessment</h4>
              <p style={{ color: '#7f1d1d', marginBottom: '10px' }}>
                <strong>Minimum Repair Cost:</strong> £{assessment.repair_cost_min.toLocaleString()}
              </p>
              <p style={{ color: '#7f1d1d', marginBottom: '10px' }}>
                <strong>Maximum Vehicle Value:</strong> £{assessment.vehicle_value_max.toLocaleString()}
              </p>
              <p style={{ color: '#7f1d1d', marginBottom: '10px' }}>
                <strong>Cost vs Value Ratio:</strong>{' '}
                {Math.round((assessment.repair_cost_min / assessment.vehicle_value_max) * 100)}% -{' '}
                {Math.round((assessment.repair_cost_max / assessment.vehicle_value_min) * 100)}%
              </p>
              <p style={{ fontSize: '1.3em', fontWeight: 700, color: '#dc2626', marginTop: '15px', textTransform: 'uppercase' }}>
                {assessment.repair_cost_min > assessment.vehicle_value_max
                  ? 'Repair costs exceed vehicle value'
                  : 'Repair may be economical'}
              </p>
            </div>
          </div>

          {/* Recommendation */}
          {assessment.recommendation === 'write-off' && (
            <div style={styles.recommendationBox}>
              <h3 style={{ fontSize: '1.5em', marginBottom: '15px' }}>RECOMMENDATION: INSURANCE WRITE-OFF</h3>
              <p style={{ fontSize: '1.1em', opacity: 0.95, marginBottom: '15px' }}>
                {assessment.recommendation_notes || 'Based on the extent of structural, mechanical, and safety-critical damage, repair costs significantly exceed the pre-accident market value of this vehicle.'}
              </p>
              {assessment.write_off_category && (
                <div style={styles.categoryBadges}>
                  <div style={styles.categoryBadge}>
                    <div style={{ fontSize: '0.8em', opacity: 0.8 }}>Likely Category</div>
                    <div style={{ fontSize: '1.3em', fontWeight: 700 }}>Category {assessment.write_off_category}</div>
                    <div style={{ fontSize: '0.75em', opacity: 0.7 }}>
                      {assessment.write_off_category === 'S' ? 'Structural damage - repairable' :
                       assessment.write_off_category === 'N' ? 'Non-structural damage - repairable' :
                       assessment.write_off_category === 'B' ? 'Break only - cannot be repaired' :
                       'Scrap only - dangerous'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div style={styles.disclaimerBox}>
            <h4 style={{ color: '#475569', marginBottom: '10px' }}>Note on Estimates</h4>
            <p style={{ color: '#64748b', fontSize: '0.9em' }}>
              Cost estimates are based on typical UK garage rates and parts prices. Actual costs may vary based on location, parts availability (OEM vs aftermarket), and workshop labour rates. Additional damage may be discovered during disassembly. These figures are provided for insurance assessment purposes only.
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {assessment.notes && (
        <div style={styles.glassCard}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #30ff37, #28cc2f)' }}>Notes</div>
            <div style={styles.sectionTitle}>Additional Notes</div>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{assessment.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <img src="/latest2.png" alt="AUTOW Services" style={styles.footerLogo} />
        <p><strong>Vehicle Damage Assessment Report</strong></p>
        <p>{assessment.vehicle_reg} | {assessment.vehicle_make} {assessment.vehicle_engine} | {assessment.vehicle_colour} | {assessment.vehicle_first_registered ? formatDate(assessment.vehicle_first_registered) : ''}</p>
        <p style={{ marginTop: '10px' }}>Assessment Date: {formatDate(assessment.assessment_date)} | Based on {assessment.photo_count} photographs + video assessment</p>
        {assessment.vehicle_mot_status && (
          <p style={{ marginTop: '5px', fontSize: '0.85em' }}>MOT: {assessment.vehicle_mot_status}</p>
        )}
        <p style={{ marginTop: '15px', fontSize: '0.8em', opacity: 0.7 }}>
          This report is based on photographic and video evidence review. A physical inspection by a qualified mechanic is recommended.
        </p>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #f0f2f5 100%)',
    color: '#1a1a2e',
    lineHeight: 1.6,
    minHeight: '100vh',
    padding: '20px',
  },
  loadingContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: '18px',
    color: '#666',
  },
  errorText: {
    fontSize: '18px',
    color: '#f44336',
  },
  actionBar: {
    maxWidth: '1200px',
    margin: '0 auto 20px auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  printBtn: {
    padding: '12px 24px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  header: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    color: 'white',
    padding: '40px',
    borderRadius: '24px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    borderTop: '4px solid #30ff37',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '30px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },
  logo: {
    height: '70px',
    filter: 'drop-shadow(0 4px 12px rgba(48, 255, 55, 0.4))',
  },
  headerText: {},
  headerTitle: {
    fontSize: '1.8em',
    fontWeight: 700,
    color: '#30ff37',
    marginBottom: '5px',
    margin: 0,
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: '0.95em',
    margin: 0,
  },
  vehicleBadge: {
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    color: '#000',
    padding: '15px 30px',
    borderRadius: '16px',
    fontWeight: 700,
    fontSize: '1.1em',
    boxShadow: '0 4px 20px rgba(48, 255, 55, 0.4)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '30px',
  },
  infoItem: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '16px 20px',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  infoLabel: {
    fontSize: '0.75em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#888',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '1.1em',
    fontWeight: 600,
    color: '#fff',
  },
  alertBanner: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    padding: '25px 30px',
    borderRadius: '20px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    boxShadow: '0 8px 30px rgba(220, 38, 38, 0.3)',
  },
  alertIcon: {
    fontSize: '2.5em',
    lineHeight: 1,
    fontWeight: 700,
  },
  alertContent: {},
  alertTitle: {
    fontSize: '1.3em',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  alertText: {
    marginBottom: '8px',
    opacity: 0.95,
    margin: '0 0 8px 0',
  },
  videoBanner: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    color: 'white',
    padding: '20px 30px',
    borderRadius: '16px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 8px 30px rgba(124, 58, 237, 0.3)',
  },
  videoLink: {
    color: '#fcd34d',
    fontWeight: 600,
  },
  glassCard: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    padding: '30px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid rgba(48, 255, 55, 0.2)',
  },
  sectionIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2em',
    color: 'white',
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '24px',
    borderRadius: '18px',
    textAlign: 'center',
    border: '2px solid transparent',
  },
  statNumber: {
    fontSize: '2.8em',
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.85em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#666',
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  th: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    color: '#30ff37',
    padding: '14px 16px',
    textAlign: 'center',
    fontSize: '0.85em',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    verticalAlign: 'middle',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '0.75em',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  priorityCritical: {
    background: '#dc2626',
    color: 'white',
  },
  priorityHigh: {
    background: '#f97316',
    color: 'white',
  },
  priorityMedium: {
    background: '#eab308',
    color: '#000',
  },
  priorityLow: {
    background: '#22c55e',
    color: 'white',
  },
  purposeBox: {
    background: '#f5f3ff',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '25px',
    borderLeft: '4px solid #7c3aed',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '30px',
  },
  valueBox: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    padding: '25px',
    borderRadius: '16px',
    border: '2px solid #f59e0b',
  },
  assessmentBox: {
    background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
    padding: '25px',
    borderRadius: '16px',
    border: '2px solid #dc2626',
  },
  recommendationBox: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    padding: '30px',
    borderRadius: '16px',
    marginTop: '25px',
    textAlign: 'center',
  },
  categoryBadges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap',
    marginTop: '20px',
  },
  categoryBadge: {
    background: 'rgba(255,255,255,0.15)',
    padding: '15px 25px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  disclaimerBox: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '20px',
    borderLeft: '4px solid #64748b',
  },
  footer: {
    textAlign: 'center',
    padding: '30px',
    color: '#64748b',
    fontSize: '0.9em',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerLogo: {
    height: '50px',
    marginBottom: '15px',
    opacity: 0.8,
  },
};
