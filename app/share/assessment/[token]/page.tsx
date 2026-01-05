'use client';

import { useParams } from 'next/navigation';

// Static assessment data for HN14-UWY based on actual video transcript
const staticAssessments: { [key: string]: any } = {
  'HN14-UWY': {
    id: 'HN14-UWY',
    vehicle_reg: 'HN14 UWY',
    vehicle_make: 'Citroen',
    vehicle_model: 'C3',
    vehicle_engine: '1199cc Petrol',
    vehicle_colour: 'Grey',
    vehicle_year: 'May 2014',
    assessment_date: '03 January 2026',
    assessment_method: 'Remote Video Inspection',
    video_duration: '3 minutes',
    assessor: 'AUTOW Services, Gavin White',
    recommendation: 'write-off',
    write_off_category: 'S',
    repair_cost_min: 3950,
    repair_cost_max: 7600,
    vehicle_value_min: 2500,
    vehicle_value_max: 4000,
    transcript: `This assessment is based on a detailed underside video inspection.

The entire lower bumper section through to the subframe has suffered severe damage. The under-tray and bumper mounting structure are completely broken away. Multiple brackets are visibly bent, with all associated trim panels snapped or missing.

The lower mounting brackets connecting to the crash bar arms are buckled.

Air-conditioning and power-steering pipework has been forced rearwards into the auxiliary belt drive system. Clear evidence of contact is visible: the rotating wheel has burnt and engraved itself into the pipework, indicating sustained friction and heat generation.

Coolant and power steering radiators both buckled and leaking, all coolant fluid has drained. Full rad pack broken, radiator support bar and crash bar legs buckled and bent.

The offside subframe, when compared to the nearside, is visibly distorted. This confirms subframe deformation rather than cosmetic variance.

Significant underside scraping is present across the anti-roll bar and surrounding areas. Brake lines and fuel lines run through this region and have clearly been struck with considerable force. At this stage, any of these lines may be compromised.

At the rear, the fuel tank shows heavy scraping and engraving consistent with a ground-impact event.

The rear axle assembly displays clear signs of impact damage. While exact alignment cannot be confirmed visually, deformation or buckling cannot be ruled out.

There is evidence of sump contact, with oil leakage visible, suggesting the sump has been struck during the incident.

The vehicle's non-start condition directly correlates with diagnostic data from the AUTEL scan report, which records:
- Alternator fault - heat load stress
- P1632 - Engine ECU internal fault (torque limitation)

These faults are consistent with an auxiliary belt lock-up event. The belt is partially displaced and forced into the engine due to displaced radiator and air-conditioning pipework being pressed against the A/C pulley.

The engine management system appears to have detected this lock-up and prevented engine start. Had the engine been allowed to run, significant secondary damage would almost certainly have occurred.

Additional damage is noted to bumper retaining hardware, with clips broken and mounting points bent. Wheel-arch liners are completely smashed, with one side entirely missing and located inside the vehicle.`,
    critical_alerts: [
      { title: 'ENGINE LOCKED', description: 'A/C and power-steering pipes forced into auxiliary belt drive. Belt burnt and engraved from sustained friction.' },
      { title: 'SUBFRAME DAMAGE', description: 'Subframe mounting brackets broken and bent. Subframe visibly distorted when compared side-to-side.' },
      { title: 'FLUID SYSTEMS AT RISK', description: 'Brake lines and fuel lines struck with considerable force - integrity cannot be confirmed. Oil leak from sump. Fuel tank heavily scraped.' }
    ],
    findings: {
      critical: [
        'A/C and power-steering pipes forced into auxiliary belt drive',
        'Auxiliary belt burnt and engraved due to pipe contact',
        'Belt displacement causing mechanical lock-up',
        'Engine start inhibited as a protective response',
        'Diagnostic correlation: alternator heat stress & ECU torque limitation (P1632)',
        'Coolant Radiator: Failure - buckled and leaking, all fluid drained',
        'AC Radiator: Failure - impacted and compromised'
      ],
      structural: [
        'Subframe mounting brackets broken and bent',
        'Subframe visibly distorted side-to-side',
        'Radiator support structure bent',
        'Bumper mounting arms and brackets damaged',
        'Crash bar legs buckled and bent'
      ],
      undercarriage: [
        { text: 'Sump impacted with visible oil leakage', priority: 'high' },
        { text: 'Fuel tank heavily scraped and engraved', priority: 'critical' },
        { text: 'Brake lines struck - integrity cannot be confirmed', priority: 'critical' },
        { text: 'Fuel lines struck - integrity cannot be confirmed', priority: 'critical' },
        { text: 'Rear axle impacted - possible deformation', priority: 'high' },
        { text: 'Anti-roll bar damaged from scraping', priority: 'high' }
      ],
      body: [
        { text: 'Full front bumper and rad pack broken', priority: 'high' },
        { text: 'Wheel-arch liners smashed / missing (one located inside vehicle)', priority: 'medium' },
        { text: 'Bumper retaining clips broken', priority: 'medium' },
        { text: 'Lower trim panels snapped or detached', priority: 'medium' },
        { text: 'Under-tray and bumper mounting structure completely broken away', priority: 'medium' }
      ]
    },
    conclusion: [
      'Structural deformation of the subframe and mounting points',
      'Mechanical intrusion of pipework into the auxiliary drive system',
      'Engine lock-up due to auxiliary belt displacement',
      'Potential compromise of critical safety systems (fuel and brake lines)',
      'Extensive underbody, fuel tank, and rear axle damage',
      'Coolant and air con system and pipework severe damage'
    ],
    cost_estimates: [
      { category: 'Engine & Drive System', components: 'A/C pipes, power steering pipes, auxiliary belt, pulleys', parts_min: 350, parts_max: 600, labour_min: 300, labour_max: 500, subtotal_min: 650, subtotal_max: 1100, color: '#dc2626' },
      { category: 'Cooling & A/C System', components: 'Coolant radiator, A/C radiator, full rad pack, hoses, coolant', parts_min: 400, parts_max: 700, labour_min: 200, labour_max: 400, subtotal_min: 600, subtotal_max: 1100, color: '#dc2626' },
      { category: 'Structural Repairs', components: 'Subframe, subframe brackets, radiator support, crash bar legs', parts_min: 600, parts_max: 1200, labour_min: 500, labour_max: 1000, subtotal_min: 1100, subtotal_max: 2200, color: '#ea580c' },
      { category: 'Undercarriage', components: 'Sump repair/replace, fuel tank inspection, anti-roll bar, rear axle check', parts_min: 300, parts_max: 600, labour_min: 250, labour_max: 500, subtotal_min: 550, subtotal_max: 1100, color: '#ca8a04' },
      { category: 'Safety-Critical Lines', components: 'Brake lines inspection/replace, fuel lines inspection/replace', parts_min: 150, parts_max: 350, labour_min: 200, labour_max: 400, subtotal_min: 350, subtotal_max: 750, color: '#dc2626' },
      { category: 'Body & Trim', components: 'Under-tray, bumper structure, wheel arch liners, trim panels, clips', parts_min: 200, parts_max: 400, labour_min: 150, labour_max: 300, subtotal_min: 350, subtotal_max: 700, color: '#2563eb' },
      { category: 'Diagnostics & Calibration', components: 'ECU fault reset, alternator check, full system diagnostic', parts_min: 0, parts_max: 0, labour_min: 150, labour_max: 300, subtotal_min: 150, subtotal_max: 300, color: '#7c3aed' },
      { category: 'Alignment & Testing', components: 'Subframe alignment, geometry check, road test', parts_min: 0, parts_max: 0, labour_min: 200, labour_max: 350, subtotal_min: 200, subtotal_max: 350, color: '#16a34a' }
    ],
    damage_markers: [
      { top: '25%', left: '78%', tooltip: 'SUBFRAME - Distorted', priority: 'critical' },
      { top: '25%', left: '65%', tooltip: 'Sump - Oil Leaking', priority: 'high' },
      { top: '25%', left: '55%', tooltip: 'Anti-roll Bar - Scraped', priority: 'high' },
      { top: '25%', left: '28%', tooltip: 'FUEL TANK - Scraped & Engraved', priority: 'critical' },
      { top: '25%', left: '18%', tooltip: 'Rear Axle - Impact Damage', priority: 'high' },
      { top: '14%', left: '82%', tooltip: 'Coolant Radiator - FAILED', priority: 'critical' },
      { top: '10%', left: '78%', tooltip: 'Full Rad Pack - Broken', priority: 'critical' },
      { top: '16%', left: '75%', tooltip: 'Crash Bar Legs - Buckled', priority: 'critical' },
      { top: '12%', left: '85%', tooltip: 'A/C Radiator - FAILED', priority: 'critical' },
      { top: '20%', left: '92%', tooltip: 'Wheel Arch Liner - Smashed', priority: 'medium' },
      { top: '55%', left: '30%', tooltip: 'Front Bumper - Destroyed', priority: 'high' },
      { top: '50%', left: '26%', tooltip: 'Under-tray - Broken Away', priority: 'high' },
      { top: '58%', left: '30%', tooltip: 'SUBFRAME BRACKETS - Broken', priority: 'critical' },
      { top: '58%', left: '70%', tooltip: 'FUEL TANK - Needs Leak Test', priority: 'critical' },
      { top: '55%', left: '70%', tooltip: 'Rear Axle Assembly - Check', priority: 'high' },
      { top: '80%', left: '82%', tooltip: 'A/C Pipes - ENGINE LOCKED!', priority: 'critical' },
      { top: '80%', left: '76%', tooltip: 'Aux Belt - Burnt & Displaced', priority: 'critical' },
      { top: '80%', left: '70%', tooltip: 'Subframe Brackets - Broken', priority: 'critical' },
      { top: '80%', left: '62%', tooltip: 'Sump - Oil Leak', priority: 'high' },
      { top: '80%', left: '54%', tooltip: 'Brake Lines - Struck', priority: 'critical' },
      { top: '80%', left: '46%', tooltip: 'Fuel Lines - Struck', priority: 'critical' },
      { top: '80%', left: '25%', tooltip: 'FUEL TANK - Scraped!', priority: 'critical' },
      { top: '80%', left: '18%', tooltip: 'Rear Axle - Impact', priority: 'high' }
    ]
  }
};

export default function SharedAssessmentPage() {
  const params = useParams();
  const token = params.token as string;
  const assessment = staticAssessments[token];

  if (!assessment) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorBox}>
          <h2 style={styles.errorTitle}>Assessment Not Found</h2>
          <p style={styles.errorText}>The requested assessment could not be found or the link has expired.</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.container} className="mobile-container">
        {/* Print Button */}
        <div style={styles.actionBar} className="no-print">
          <button onClick={handlePrint} style={styles.printBtn} className="mobile-btn">
            Print / Save as PDF
          </button>
        </div>

        {/* Header */}
        <div style={styles.header} className="mobile-header">
          <div style={styles.headerTop}>
            <div style={styles.logoSection}>
              <img src="https://autow-services.co.uk/logo.png" alt="AUTOW Services" style={styles.logo} className="mobile-logo" />
              <div style={styles.headerText}>
                <h1 style={styles.headerTitle} className="mobile-title">Vehicle Damage Assessment</h1>
                <p style={styles.headerSubtitle} className="mobile-subtitle">Professional Inspection Report</p>
              </div>
            </div>
            <div style={styles.regBadge} className="mobile-badge">{assessment.vehicle_reg}</div>
          </div>

          <div style={styles.infoGrid} className="mobile-grid">
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Make / Model</div>
              <div style={styles.infoValue} className="mobile-info-value">{assessment.vehicle_make} ({assessment.vehicle_engine})</div>
            </div>
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Colour</div>
              <div style={styles.infoValue} className="mobile-info-value">{assessment.vehicle_colour}</div>
            </div>
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Year</div>
              <div style={styles.infoValue} className="mobile-info-value">{assessment.vehicle_year}</div>
            </div>
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Assessment Method</div>
              <div style={styles.infoValue} className="mobile-info-value">{assessment.assessment_method}</div>
            </div>
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Assessment Date</div>
              <div style={{ ...styles.infoValue, color: '#4ade80' }} className="mobile-info-value">{assessment.assessment_date}</div>
            </div>
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Video Duration</div>
              <div style={styles.infoValue} className="mobile-info-value">{assessment.video_duration}</div>
            </div>
            <div style={styles.infoItem} className="mobile-info-item">
              <div style={styles.infoLabel} className="mobile-info-label">Assessor</div>
              <div style={styles.infoValue} className="mobile-info-value">{assessment.assessor}</div>
            </div>
          </div>
        </div>

        {/* Critical Alert */}
        <div style={styles.alertBanner} className="mobile-alert">
          <div style={styles.alertTitle} className="mobile-alert-title">
            <span style={{ fontSize: '1.2em' }}>&#9888;</span>
            CRITICAL: Multiple Safety Systems Compromised - Vehicle NOT Roadworthy
          </div>
          <div style={styles.alertContent}>
            {assessment.critical_alerts.map((alert: any, index: number) => (
              <p key={index} style={styles.alertText} className="mobile-alert-text">
                <strong>{index + 1}. {alert.title}:</strong> {alert.description}
              </p>
            ))}
          </div>
        </div>

        {/* Assessment Voice Transcript */}
        <div style={styles.card} className="mobile-card">
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIcon, background: 'rgba(124,58,237,0.2)' }}>&#128221;</div>
            <div style={styles.cardTitle} className="mobile-title">Assessment Voice Transcript</div>
          </div>
          <div style={styles.transcript} className="mobile-transcript">
            {assessment.transcript.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} style={styles.transcriptParagraph}>
                {paragraph.startsWith('- ') ? (
                  <ul style={{ margin: '15px 0 15px 20px', color: '#dc2626' }}>
                    {paragraph.split('\n').map((line: string, i: number) => (
                      <li key={i}>{line.replace('- ', '')}</li>
                    ))}
                  </ul>
                ) : paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Key Findings Summary */}
        <div style={styles.card} className="mobile-card">
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIcon, background: 'rgba(220,38,38,0.2)' }}>&#9888;</div>
            <div style={styles.cardTitle} className="mobile-title">Key Findings Summary</div>
          </div>

          {/* Critical - Engine & Drive System */}
          <div style={styles.findingGroup}>
            <div style={{ ...styles.findingGroupTitle, background: 'rgba(220,38,38,0.15)', color: '#f87171', borderLeft: '3px solid #dc2626' }} className="mobile-finding-title">
              CRITICAL - ENGINE & DRIVE SYSTEM
            </div>
            <ul style={styles.findingList}>
              {assessment.findings.critical.map((item: string, index: number) => (
                <li key={index} style={styles.findingItem} className="mobile-finding-item">
                  <span style={{ ...styles.findingMarker, background: '#dc2626', color: '#fff' }} className="mobile-finding-marker">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Structural Damage */}
          <div style={styles.findingGroup}>
            <div style={{ ...styles.findingGroupTitle, background: 'rgba(249,115,22,0.15)', color: '#fb923c', borderLeft: '3px solid #f97316' }} className="mobile-finding-title">
              STRUCTURAL DAMAGE
            </div>
            <ul style={styles.findingList}>
              {assessment.findings.structural.map((item: string, index: number) => (
                <li key={index} style={styles.findingItem} className="mobile-finding-item">
                  <span style={{ ...styles.findingMarker, background: '#f97316', color: '#fff' }} className="mobile-finding-marker">X</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Undercarriage Damage */}
          <div style={styles.findingGroup}>
            <div style={{ ...styles.findingGroupTitle, background: 'rgba(234,179,8,0.15)', color: '#fbbf24', borderLeft: '3px solid #eab308' }} className="mobile-finding-title">
              UNDERCARRIAGE DAMAGE
            </div>
            <ul style={styles.findingList}>
              {assessment.findings.undercarriage.map((item: any, index: number) => (
                <li key={index} style={styles.findingItem} className="mobile-finding-item">
                  <span style={{
                    ...styles.findingMarker,
                    background: item.priority === 'critical' ? '#dc2626' : '#f97316',
                    color: '#fff'
                  }} className="mobile-finding-marker">{item.priority === 'critical' ? '!' : 'X'}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Body & Trim */}
          <div style={styles.findingGroup}>
            <div style={{ ...styles.findingGroupTitle, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderLeft: '3px solid #3b82f6' }} className="mobile-finding-title">
              BODY & TRIM
            </div>
            <ul style={styles.findingList}>
              {assessment.findings.body.map((item: any, index: number) => (
                <li key={index} style={styles.findingItem} className="mobile-finding-item">
                  <span style={{
                    ...styles.findingMarker,
                    background: item.priority === 'high' ? '#f97316' : '#eab308',
                    color: item.priority === 'medium' ? '#000' : '#fff'
                  }} className="mobile-finding-marker">X</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Damage Location Map */}
        <div style={styles.card} className="mobile-card">
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIcon, background: 'rgba(59,130,246,0.2)' }}>&#128663;</div>
            <div style={styles.cardTitle} className="mobile-title">Damage Location Map</div>
          </div>
          <p style={{ color: '#64748b', marginBottom: '15px', fontSize: '0.9em' }} className="mobile-text">Tap markers to see damage details</p>

          <div style={styles.diagramContainer}>
            <div style={styles.diagramWrapper}>
              <img
                src="https://thumbs.dreamstime.com/b/car-line-draw-four-all-view-top-side-back-insurance-rent-damage-condition-report-form-blueprint-72007177.jpg"
                alt="Vehicle Damage Diagram"
                style={styles.diagramImage}
              />
              {assessment.damage_markers.map((marker: any, index: number) => (
                <div
                  key={index}
                  className="damage-marker"
                  style={{
                    ...styles.damageMarker,
                    top: marker.top,
                    left: marker.left,
                    background: marker.priority === 'critical' ? '#dc2626' :
                               marker.priority === 'high' ? '#f97316' : '#eab308',
                    color: marker.priority === 'medium' ? '#000' : '#fff'
                  }}
                  data-tooltip={marker.tooltip}
                >
                  {marker.priority === 'critical' ? '!' : (index + 1)}
                </div>
              ))}
            </div>

            <div style={styles.legend} className="mobile-legend">
              <div style={styles.legendTitle} className="mobile-legend-title">Damage Severity</div>
              <div style={styles.legendItem} className="mobile-legend-item">
                <span style={{ ...styles.legendDot, background: '#dc2626' }} className="mobile-legend-dot"></span>
                <span>Critical - Safety Risk</span>
              </div>
              <div style={styles.legendItem} className="mobile-legend-item">
                <span style={{ ...styles.legendDot, background: '#f97316' }} className="mobile-legend-dot"></span>
                <span>High - Major Damage</span>
              </div>
              <div style={styles.legendItem} className="mobile-legend-item">
                <span style={{ ...styles.legendDot, background: '#eab308' }} className="mobile-legend-dot"></span>
                <span>Medium - Significant</span>
              </div>
              <div style={styles.legendItem} className="mobile-legend-item">
                <span style={{ ...styles.legendDot, background: '#22c55e' }} className="mobile-legend-dot"></span>
                <span>Low - Minor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessor's Conclusion */}
        <div style={styles.card} className="mobile-card">
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIcon, background: 'rgba(34,197,94,0.2)' }}>&#9989;</div>
            <div style={styles.cardTitle} className="mobile-title">Assessor's Conclusion</div>
          </div>

          <p style={{ marginBottom: '20px', color: '#475569' }} className="mobile-text">
            The vehicle has sustained substantial underside impact consistent with sliding across the road surface with significant force.
          </p>

          <p style={{ marginBottom: '15px', color: '#64748b', fontWeight: 600 }} className="mobile-text">This has resulted in:</p>

          <ol style={styles.conclusionList}>
            {assessment.conclusion.map((item: string, index: number) => (
              <li key={index} style={styles.conclusionItem} className="mobile-conclusion-item">{item}</li>
            ))}
          </ol>

          <div style={styles.finalAssessmentBox}>
            <p style={{ color: '#dc2626' }}>
              <strong>Final Assessment:</strong> Based on the observed damage and correlated diagnostic data, the vehicle is repairable but estimated costs (£{assessment.repair_cost_min.toLocaleString()} - £{assessment.repair_cost_max.toLocaleString()}) exceed the vehicle's market value (£{assessment.vehicle_value_min.toLocaleString()} - £{assessment.vehicle_value_max.toLocaleString()}), making repair economically unviable.
            </p>
          </div>
        </div>

        {/* Insurance Claim Assessment */}
        <div style={styles.card} className="mobile-card">
          <div style={styles.cardHeader}>
            <div style={{ ...styles.cardIcon, background: 'rgba(249,115,22,0.2)' }}>&#163;</div>
            <div style={styles.cardTitle} className="mobile-title">Insurance Claim Assessment - Economic Evaluation</div>
          </div>

          <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '0.9em' }} className="mobile-text">
            <strong>Purpose:</strong> To determine if repair costs exceed vehicle market value, which would classify this as an insurance write-off (Category B, S, or N depending on structural damage severity).
          </p>

          {/* Repair Costs Table */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#16a34a', marginBottom: '15px', fontSize: '0.95em', textTransform: 'uppercase', letterSpacing: '1px' }} className="mobile-value-title">Estimated Repair Costs</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table} className="mobile-table">
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={styles.th}>Repair Category</th>
                    <th style={styles.th} className="hide-mobile">Components</th>
                    <th style={styles.th} className="hide-mobile-sm">Est. Parts</th>
                    <th style={styles.th}>Est. Labour</th>
                    <th style={styles.th}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.cost_estimates.map((cost: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ ...styles.td, fontWeight: 600, color: cost.color }}>{cost.category}</td>
                      <td style={{ ...styles.td, color: '#64748b' }} className="hide-mobile">{cost.components}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: '#334155' }} className="hide-mobile-sm">
                        {cost.parts_min > 0 ? `£${cost.parts_min} - £${cost.parts_max}` : '-'}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', color: '#334155' }}>£{cost.labour_min} - £{cost.labour_max}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>£{cost.subtotal_min.toLocaleString()} - £{cost.subtotal_max.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fef2f2', borderTop: '2px solid #dc2626' }}>
                    <td colSpan={4} style={{ padding: '15px', fontWeight: 700, color: '#dc2626', fontSize: '1em' }} className="total-label">TOTAL ESTIMATED REPAIR COST VARIES:</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 700, color: '#dc2626', fontSize: '1.1em' }}>£{assessment.repair_cost_min.toLocaleString()} - £{assessment.repair_cost_max.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Vehicle Value & Economic Assessment Grid */}
          <div style={styles.valueGrid}>
            <div style={styles.valueBox} className="mobile-value-box">
              <h4 style={{ color: '#16a34a', marginBottom: '15px', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }} className="mobile-value-title">Vehicle Market Value</h4>
              <p style={{ color: '#64748b', marginBottom: '10px', fontSize: '0.85em' }} className="mobile-text">Vehicle: {assessment.vehicle_year} {assessment.vehicle_make} {assessment.vehicle_model} {assessment.vehicle_engine}</p>
              <div style={{ fontSize: '1.8em', fontWeight: 700, color: '#16a34a', marginBottom: '10px' }} className="mobile-value-amount">£{assessment.vehicle_value_min.toLocaleString()} - £{assessment.vehicle_value_max.toLocaleString()}</div>
              <p style={{ color: '#94a3b8', fontSize: '0.8em' }} className="mobile-text">Based on typical UK market values</p>
            </div>

            <div style={styles.assessmentValueBox} className="mobile-value-box">
              <h4 style={{ color: '#16a34a', marginBottom: '15px', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }} className="mobile-value-title">Economic Assessment</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Minimum Repair Cost:</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>£{assessment.repair_cost_min.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Maximum Vehicle Value:</span>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>£{assessment.vehicle_value_max.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Cost vs Value Ratio:</span>
                  <span style={{ fontWeight: 600, color: '#ca8a04' }}>
                    {Math.round((assessment.repair_cost_min / assessment.vehicle_value_max) * 100)}% - {Math.round((assessment.repair_cost_max / assessment.vehicle_value_min) * 100)}%
                  </span>
                </div>
                <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', marginTop: '5px' }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>Repair costs meet or exceed vehicle value</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Banner */}
          <div style={styles.recommendationBanner} className="mobile-recommendation">
            <div style={{ fontSize: '1.4em', fontWeight: 700, marginBottom: '8px' }} className="mobile-recommendation-title">REPAIR COSTS OUT-WEIGH VEHICLE VALUE</div>
            <div style={{ fontSize: '0.95em', opacity: 0.95, marginBottom: '12px' }}>From an Insurance Perspective this would be considered a Write-Off</div>
            <p style={{ opacity: 0.9, maxWidth: '700px', margin: '0 auto', lineHeight: 1.5, fontSize: '0.85em' }} className="mobile-recommendation-text">
              Based on the extent of structural, mechanical, and safety-critical damage, repair costs significantly exceed the pre-accident market value of this vehicle. The combination of subframe deformation, auxiliary belt lock-up, cooling system failure, and potential brake/fuel line compromise makes economical repair unfeasible.
            </p>
          </div>

          {/* Category Badges */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#64748b', textAlign: 'center', marginBottom: '15px', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '1px' }} className="mobile-value-title">Potential Write-Off Categories</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ ...styles.categoryBadge, borderColor: '#ea580c', background: '#fff7ed' }} className="mobile-category">
                <div style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '5px' }} className="mobile-category-label">Category</div>
                <div style={{ fontSize: '2em', fontWeight: 700, color: '#ea580c', marginBottom: '8px' }} className="mobile-category-value">S</div>
                <div style={{ color: '#78716c', fontSize: '0.75em', lineHeight: 1.4 }} className="mobile-category-desc">
                  <strong>Structural Damage</strong><br />
                  Vehicle has structural damage but can be repaired safely. Must pass inspection before returning to road.
                </div>
              </div>
              <div style={{ ...styles.categoryBadge, borderColor: '#eab308', background: '#fefce8' }} className="mobile-category">
                <div style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '5px' }} className="mobile-category-label">Category</div>
                <div style={{ fontSize: '2em', fontWeight: 700, color: '#eab308', marginBottom: '8px' }} className="mobile-category-value">N</div>
                <div style={{ color: '#78716c', fontSize: '0.75em', lineHeight: 1.4 }} className="mobile-category-desc">
                  <strong>Non-Structural Damage</strong><br />
                  No structural damage. Cosmetic or mechanical damage only. Can be repaired and returned to road.
                </div>
              </div>
            </div>
          </div>

          {/* Note on Estimates */}
          <div style={styles.noteBox} className="mobile-note">
            <h4 style={{ color: '#64748b', marginBottom: '10px', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '1px' }} className="mobile-note-title">Note on Estimates</h4>
            <p style={{ color: '#475569', fontSize: '0.9em', lineHeight: 1.7 }} className="mobile-note-text">
              Cost estimates are based on typical UK garage rates and parts prices for a 2014 Citroen C3. Actual costs may vary based on location, parts availability (OEM vs aftermarket), and workshop labour rates. Additional hidden damage may be discovered during disassembly, particularly to brake and fuel lines which require physical inspection. These figures are provided for insurance assessment purposes only.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer} className="mobile-footer">
          <img src="https://autow-services.co.uk/logo.png" alt="AUTOW Services" style={styles.footerLogo} className="mobile-footer-logo" />
          <p>Report Compiled: {assessment.assessment_date}</p>
          <p>Assessment Method: Video Evidence Review</p>
          <p style={{ marginTop: '10px', color: '#94a3b8' }}>AUTOW Services - Professional Vehicle Damage Assessment</p>
        </div>
    </div>
  );
}

// Mobile responsive styles are now in globals.css

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    color: '#1e293b',
    lineHeight: 1.6,
    minHeight: '100vh',
    padding: '20px',
  },
  errorContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  errorBox: {
    textAlign: 'center',
    padding: '60px 40px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  errorTitle: {
    color: '#dc2626',
    marginBottom: '10px',
  },
  errorText: {
    color: '#64748b',
  },
  actionBar: {
    maxWidth: '1000px',
    margin: '0 auto 20px auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  printBtn: {
    padding: '12px 24px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderTop: '4px solid #22c55e',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '20px',
    maxWidth: '1000px',
    margin: '0 auto 20px auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '25px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logo: {
    height: '60px',
  },
  headerText: {},
  headerTitle: {
    fontSize: '1.5em',
    color: '#22c55e',
    marginBottom: '3px',
    margin: 0,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: '0.9em',
    margin: 0,
  },
  regBadge: {
    background: '#22c55e',
    color: '#000',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '1.2em',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  infoItem: {
    background: 'rgba(255,255,255,0.1)',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: '0.7em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#94a3b8',
    marginBottom: '3px',
  },
  infoValue: {
    fontWeight: 600,
    color: '#fff',
  },
  alertBanner: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '20px',
    maxWidth: '1000px',
    margin: '0 auto 20px auto',
    border: '1px solid #ef4444',
    color: '#fff',
  },
  alertTitle: {
    fontSize: '1.2em',
    fontWeight: 700,
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#fff',
  },
  alertContent: {
    color: '#fff',
  },
  alertText: {
    marginBottom: '8px',
    opacity: 0.95,
    color: '#fff',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '20px',
    maxWidth: '1000px',
    margin: '0 auto 20px auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #e2e8f0',
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2em',
  },
  cardTitle: {
    fontSize: '1.1em',
    fontWeight: 600,
    color: '#16a34a',
  },
  transcript: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    fontSize: '0.95em',
    lineHeight: 1.8,
    color: '#475569',
  },
  transcriptParagraph: {
    marginBottom: '15px',
  },
  findingGroup: {
    marginBottom: '25px',
  },
  findingGroupTitle: {
    fontWeight: 700,
    marginBottom: '12px',
    padding: '10px 15px',
    borderRadius: '8px',
    fontSize: '0.9em',
  },
  findingList: {
    listStyle: 'none',
    paddingLeft: '15px',
    margin: 0,
  },
  findingItem: {
    padding: '8px 0',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    color: '#334155',
  },
  findingMarker: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7em',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '2px',
  },
  diagramContainer: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  diagramWrapper: {
    flex: 1,
    minWidth: '300px',
    position: 'relative',
    background: '#f8f9fa',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  diagramImage: {
    width: '100%',
    display: 'block',
  },
  damageMarker: {
    position: 'absolute',
  },
  legend: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '200px',
  },
  legendTitle: {
    fontWeight: 700,
    color: '#16a34a',
    marginBottom: '15px',
    fontSize: '0.9em',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
  },
  legendDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  conclusionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  conclusionItem: {
    padding: '12px 15px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '10px',
    borderLeft: '3px solid #16a34a',
    color: '#334155',
  },
  finalAssessmentBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '25px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9em',
  },
  th: {
    padding: '12px 15px',
    textAlign: 'left',
    color: '#64748b',
  },
  td: {
    padding: '12px 15px',
  },
  valueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  valueBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
  },
  assessmentValueBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
  },
  recommendationBanner: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#fff',
  },
  categoryBadge: {
    background: '#fff7ed',
    border: '2px solid #ea580c',
    borderRadius: '12px',
    padding: '15px 25px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '300px',
  },
  noteBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
  },
  footer: {
    textAlign: 'center',
    padding: '30px',
    color: '#64748b',
    fontSize: '0.85em',
    borderTop: '1px solid #e2e8f0',
    marginTop: '30px',
    maxWidth: '1000px',
    margin: '30px auto 0 auto',
  },
  footerLogo: {
    height: '40px',
    marginBottom: '10px',
    opacity: 0.7,
  },
};
