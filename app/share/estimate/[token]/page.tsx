import pool from '@/lib/db';
import { Estimate } from '@/lib/types';
import PrintButton from './PrintButton';

async function getEstimateData(token: string) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT e.*,
        json_agg(
          json_build_object(
            'id', li.id,
            'description', li.description,
            'item_type', li.item_type,
            'rate', li.rate,
            'quantity', li.quantity,
            'amount', li.amount,
            'sort_order', li.sort_order
          ) ORDER BY li.sort_order
        ) FILTER (WHERE li.id IS NOT NULL) as line_items
       FROM estimates e
       LEFT JOIN line_items li ON li.document_type = 'estimate' AND li.document_id = e.id
       WHERE e.share_token = $1
       GROUP BY e.id`,
      [token]
    );

    if (result.rows.length === 0) {
      return { estimate: null, businessSettings: null };
    }

    const estimate = result.rows[0];

    let businessSettings = null;
    try {
      const settingsResult = await client.query(
        'SELECT * FROM business_settings LIMIT 1'
      );
      businessSettings = settingsResult.rows[0] || null;
    } catch (settingsError) {
      console.error('Business settings query failed:', settingsError);
    }

    return { estimate, businessSettings };
  } finally {
    client.release();
  }
}

export default async function SharedEstimatePage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const { estimate, businessSettings } = await getEstimateData(token);

  if (!estimate) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>Estimate not found or link has expired</div>
      </div>
    );
  }

  // Calculate breakdown by item type
  const breakdown = {
    parts: 0,
    service: 0,
    labor: 0,
    other: 0,
    discount: 0
  };

  estimate.line_items?.forEach((item: any) => {
    const amount = parseFloat(item.amount.toString());
    if (item.item_type === 'part') {
      breakdown.parts += amount;
    } else if (item.item_type === 'service') {
      breakdown.service += amount;
    } else if (item.item_type === 'labor') {
      breakdown.labor += amount;
    } else if (item.item_type === 'discount') {
      breakdown.discount += Math.abs(amount);
    } else {
      breakdown.other += amount;
    }
  });

  // Use document-level overrides if set, otherwise fall back to business_settings or defaults
  const defaults = {
    business_name: 'AUTOW SERVICES LTD',
    email: 'info@autow-services.co.uk',
    address: 'Alverton, Penzance, TR18 4QB',
    workshop_location: 'WORKSHOP LOCATION PENZANCE',
    phone: '07352968276',
    website: 'https://www.autow-services.co.uk',
    owner: 'Business owner name'
  };

  const settings = {
    business_name: estimate.business_name || businessSettings?.business_name || defaults.business_name,
    email: estimate.business_email || businessSettings?.email || defaults.email,
    address: estimate.business_address || businessSettings?.address || defaults.address,
    workshop_location: estimate.business_workshop_location || businessSettings?.workshop_location || defaults.workshop_location,
    phone: estimate.business_phone || businessSettings?.phone || defaults.phone,
    website: estimate.business_website || businessSettings?.website || defaults.website,
    owner: businessSettings?.owner || defaults.owner
  };

  return (
    <div style={styles.container} className="estimate-container mobile-full-height">
      {/* Print Button (don't print) */}
      <div style={styles.actionBar} className="no-print">
        <PrintButton />
      </div>

      {/* Document */}
      <div style={styles.document} className="estimate-document">
        {/* Header */}
        <div style={styles.docHeader} className="doc-header">
          <div>
            <h1 style={styles.docTitle}>ESTIMATE</h1>
            {estimate.estimate_number && (
              <p style={styles.docNumber}>#{estimate.estimate_number}</p>
            )}
            <p style={styles.docDate}>Date: {new Date(estimate.estimate_date).toLocaleDateString('en-GB')}</p>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <img
              src="/latest2.png"
              alt="AUTOW"
              style={styles.logo}
            />
          </div>
        </div>

        {/* From / To */}
        <div style={styles.parties} className="parties">
          <div style={styles.party}>
            <h3 style={styles.partyTitle}>From</h3>
            <p style={styles.businessName}>{settings.business_name}</p>
            <p style={styles.partyText}>Email: {settings.email}</p>
            <p style={styles.partyText}>Address: {settings.address}</p>
            {settings.workshop_location && <p style={styles.partyText}>{settings.workshop_location}</p>}
            <p style={styles.partyText}>Phone: {settings.phone}</p>
            <p style={styles.partyText}>Website: {settings.website}</p>
          </div>

          <div style={styles.party}>
            <h3 style={styles.partyTitle}>Bill To</h3>
            <p style={styles.clientName}>{estimate.client_name}</p>
            {estimate.client_phone && <p style={styles.partyText}>Phone: {estimate.client_phone}</p>}
            {estimate.client_mobile && <p style={styles.partyText}>Mobile: {estimate.client_mobile}</p>}
          </div>
        </div>

        {/* Vehicle Info */}
        {estimate.vehicle_reg && (
          <div style={styles.vehicleInfo} className="vehicle-info">
            <strong>Vehicle:</strong> {estimate.vehicle_reg}
            {estimate.vehicle_make && ` - ${estimate.vehicle_make}`}
            {estimate.vehicle_model && ` ${estimate.vehicle_model}`}
          </div>
        )}

        {/* Line Items */}
        <div className="table-container">
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.descCol }} className="desc-col">DESCRIPTION</th>
                <th style={{ ...styles.th, ...styles.rateCol }} className="rate-col">RATE</th>
                <th style={{ ...styles.th, ...styles.qtyCol }} className="qty-col">QTY</th>
                <th style={{ ...styles.th, ...styles.amountCol }} className="amount-col">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {estimate.line_items && estimate.line_items.map((item: any, index: number) => (
                <tr key={index}>
                  <td style={{ ...styles.td, ...styles.descCol }} className="desc-col">
                    <span style={styles.descriptionText}>{item.description}</span>
                    {item.item_type !== 'service' && (
                      <span style={item.item_type === 'discount' ? styles.discountType : styles.itemType}> ({item.item_type})</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, ...styles.rateCol, textAlign: 'center' as const }} className="rate-col">
                    £{parseFloat(item.rate.toString()).toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, ...styles.qtyCol, textAlign: 'center' as const }} className="qty-col">
                    {item.quantity}
                  </td>
                  <td style={{ ...styles.td, ...styles.amountCol, textAlign: 'right' as const, ...(item.item_type === 'discount' ? { color: '#ff9800' } : {}) }} className="amount-col">
                    {item.item_type === 'discount' ? '-' : ''}£{parseFloat(item.amount.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={styles.totalsSection} className="totals-section">
          <div style={styles.totalsBox} className="totals-box">
            {breakdown.parts > 0 && (
              <div style={styles.breakdownRow}>
                <span>Parts Total</span>
                <span>£{breakdown.parts.toFixed(2)}</span>
              </div>
            )}
            {breakdown.service > 0 && (
              <div style={styles.breakdownRow}>
                <span>Service Total</span>
                <span>£{breakdown.service.toFixed(2)}</span>
              </div>
            )}
            {breakdown.labor > 0 && (
              <div style={styles.breakdownRow}>
                <span>Labour Total</span>
                <span>£{breakdown.labor.toFixed(2)}</span>
              </div>
            )}
            {breakdown.other > 0 && (
              <div style={styles.breakdownRow}>
                <span>Other Total</span>
                <span>£{breakdown.other.toFixed(2)}</span>
              </div>
            )}
            {breakdown.discount > 0 && (
              <div style={styles.discountRow}>
                <span>Discount</span>
                <span>-£{breakdown.discount.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>£{parseFloat(estimate.subtotal.toString()).toFixed(2)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>VAT ({estimate.vat_rate}%)</span>
              <span>£{parseFloat(estimate.vat_amount.toString()).toFixed(2)}</span>
            </div>
            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <span>Total</span>
              <span>£{parseFloat(estimate.total.toString()).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div style={styles.notesSection} className="notes-section">
            <h3 style={styles.notesTitle}>Notes</h3>
            <p style={styles.notesText}>{estimate.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer} className="footer">
          <p>Thank you for your business!</p>
          <p style={styles.footerSmall}>
            This is an estimate. Additional works or parts will incur further costs - you will be notified.
          </p>
          <div style={styles.disclaimer} className="disclaimer">
            <p style={styles.disclaimerText}>
              AUTOW Services provides mobile mechanics and recovery services.
              Parts are subject to manufacturer warranty. Payment terms: Parts and/or vehicle collection/recovery required upfront,
              labour on completion. Unpaid invoices may incur late payment fees. By accepting this estimate, you agree to these terms.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .estimate-document { box-shadow: none !important; }
        }

        /* Table container scrolling for small screens */
        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          .estimate-document { -webkit-text-size-adjust: 100%; }
        }
      `}</style>
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
  actionBar: {
    maxWidth: 'min(900px, 95vw)',
    margin: '0 auto min(20px, 4vw) auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  document: {
    maxWidth: 'min(900px, 95vw)',
    margin: '0 auto',
    background: '#fff',
    color: '#000',
    padding: 'clamp(15px, 5vw, 60px)',
    borderRadius: 'min(12px, 3vw)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  docHeader: {
    display: 'flex',
    flexWrap: 'nowrap' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'min(15px, 4vw)',
    marginBottom: 'min(40px, 8vw)',
    paddingBottom: 'min(20px, 4vw)',
    borderBottom: '3px solid #30ff37',
  },
  docTitle: {
    fontSize: 'clamp(1.5rem, 7vw, 2.25rem)',
    fontWeight: '700' as const,
    color: '#30ff37',
    margin: '0 0 min(10px, 2vw) 0',
  },
  docNumber: {
    fontSize: 'clamp(0.85rem, 4vw, 1.125rem)',
    color: '#30ff37',
    margin: 'min(5px, 1vw) 0',
    fontFamily: 'monospace',
  },
  docDate: {
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
    color: '#666',
    margin: '0',
  },
  logo: {
    width: 'clamp(80px, 20vw, 150px)',
    height: 'auto',
    flexShrink: 0,
  },
  parties: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
    gap: 'min(30px, 6vw)',
    marginBottom: 'min(20px, 4vw)',
  },
  party: {
    lineHeight: 1.4,
    fontSize: 'clamp(0.65rem, 3vw, 0.75rem)',
  },
  partyTitle: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.7rem)',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: '#666',
    marginBottom: 'min(6px, 1.5vw)',
    margin: '0 0 min(6px, 1.5vw) 0',
  },
  businessName: {
    fontSize: 'clamp(0.7rem, 3.2vw, 0.8rem)',
    fontWeight: '700' as const,
    margin: '0 0 2px 0',
  },
  clientName: {
    fontSize: 'clamp(0.7rem, 3.2vw, 0.8rem)',
    fontWeight: '700' as const,
    margin: '0 0 2px 0',
  },
  partyText: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.7rem)',
    margin: '0 0 1px 0',
    color: '#444',
  },
  vehicleInfo: {
    background: '#f8f8f8',
    padding: 'min(15px, 4vw)',
    borderRadius: 'min(8px, 2vw)',
    marginBottom: 'min(30px, 6vw)',
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
    border: '1px solid #e0e0e0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: 'min(30px, 6vw)',
    tableLayout: 'fixed' as const,
  },
  descCol: {
    width: '55%',
    textAlign: 'left' as const,
  },
  rateCol: {
    width: '15%',
    textAlign: 'center' as const,
  },
  qtyCol: {
    width: '10%',
    textAlign: 'center' as const,
  },
  amountCol: {
    width: '20%',
    textAlign: 'right' as const,
  },
  th: {
    padding: 'min(12px, 3vw) min(8px, 2vw)',
    borderBottom: '2px solid #30ff37',
    fontSize: 'clamp(0.55rem, 2.5vw, 0.75rem)',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: '#666',
    textAlign: 'center' as const,
  },
  td: {
    padding: 'min(15px, 3vw) min(8px, 2vw)',
    borderBottom: '1px solid #e0e0e0',
    fontSize: 'clamp(0.65rem, 3vw, 0.875rem)',
    background: '#fafafa',
  },
  itemType: {
    fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)',
    color: '#666',
    fontStyle: 'italic' as const,
  },
  descriptionText: {
    whiteSpace: 'pre-line' as const,
  },
  discountType: {
    fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)',
    color: '#ff9800',
    fontStyle: 'italic' as const,
    fontWeight: '600' as const,
  },
  totalsSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 'min(40px, 8vw)',
  },
  totalsBox: {
    minWidth: 'min(300px, 100%)',
    background: '#f8f8f8',
    padding: 'min(20px, 4vw)',
    borderRadius: 'min(8px, 2vw)',
    border: '1px solid #e0e0e0',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'min(8px, 2vw) 0',
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
    color: '#666',
  },
  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'min(8px, 2vw) 0',
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
    color: '#ff9800',
    fontWeight: '600' as const,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'min(10px, 2.5vw) 0',
    fontSize: 'clamp(0.8rem, 3.5vw, 1rem)',
  },
  grandTotal: {
    fontSize: 'clamp(1rem, 4.5vw, 1.25rem)',
    fontWeight: '700' as const,
    paddingTop: 'min(15px, 3vw)',
    borderTop: '2px solid #30ff37',
    marginTop: 'min(10px, 2vw)',
    color: '#30ff37',
  },
  notesSection: {
    background: '#f8f8f8',
    padding: 'min(12px, 3vw) min(15px, 4vw)',
    borderRadius: 'min(6px, 1.5vw)',
    marginBottom: 'min(20px, 4vw)',
    border: '1px solid #e0e0e0',
  },
  notesTitle: {
    fontSize: 'clamp(0.6rem, 2.5vw, 0.7rem)',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: '#666',
    marginBottom: 'min(6px, 1.5vw)',
    margin: '0 0 min(6px, 1.5vw) 0',
  },
  notesText: {
    fontSize: 'clamp(0.6rem, 2.8vw, 0.7rem)',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap' as const,
    margin: '0',
    color: '#444',
  },
  footer: {
    textAlign: 'center' as const,
    paddingTop: 'min(40px, 8vw)',
    borderTop: '1px solid #e0e0e0',
    color: '#666',
    fontSize: 'clamp(0.7rem, 3vw, 0.875rem)',
  },
  footerSmall: {
    fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)',
    marginTop: 'min(10px, 2vw)',
  },
  disclaimer: {
    marginTop: 'min(20px, 4vw)',
    paddingTop: 'min(20px, 4vw)',
    borderTop: '1px solid #e0e0e0',
  },
  disclaimerText: {
    fontSize: 'clamp(0.5rem, 2vw, 0.56rem)',
    color: '#999',
    margin: '0',
    lineHeight: 1.4,
    textAlign: 'justify' as const,
  },
  errorText: {
    fontSize: 'clamp(1rem, 4vw, 1.125rem)',
    textAlign: 'center' as const,
    padding: 'min(60px, 15vw) min(20px, 5vw)',
    color: '#f44336',
  },
};
