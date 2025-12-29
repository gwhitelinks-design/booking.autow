'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Invoice } from '@/lib/types';

export default function SharedInvoicePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchSharedInvoice();
    }
  }, [token]);

  const fetchSharedInvoice = async () => {
    try {
      const response = await fetch(`/api/share/invoice/${token}`);

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
        setBusinessSettings(data.business_settings);
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.details || 'Invoice not found or link has expired');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to load invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>{error || 'Invoice not found'}</div>
      </div>
    );
  }

  // Calculate breakdown by item type
  const breakdown = {
    parts: 0,
    service: 0,
    labor: 0,
    other: 0
  };

  invoice.line_items?.forEach((item) => {
    const amount = parseFloat(item.amount.toString());
    if (item.item_type === 'part') {
      breakdown.parts += amount;
    } else if (item.item_type === 'service') {
      breakdown.service += amount;
    } else if (item.item_type === 'labor') {
      breakdown.labor += amount;
    } else {
      breakdown.other += amount;
    }
  });

  const settings = businessSettings || {
    business_name: 'AUTOW Services',
    email: 'info@autow-services.co.uk',
    address: 'Alverton, Penzance, TR18 4QB',
    workshop_location: 'WORKSHOP LOCATION PENZANCE',
    phone: '07352968276',
    website: 'https://www.autow-services.co.uk',
    owner: 'Business owner name'
  };

  return (
    <div style={styles.container}>
      {/* Print Button (don't print) */}
      <div style={styles.actionBar} className="no-print">
        <button onClick={handlePrint} style={styles.printBtn}>
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Document */}
      <div style={styles.document}>
        {/* Header */}
        <div style={styles.docHeader} className="doc-header">
          <div>
            <h1 style={styles.docTitle}>INVOICE</h1>
            <p style={styles.docDate}>Date: {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</p>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <img
              src="https://autow-services.co.uk/logo.png"
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
            <p>Email: {settings.email}</p>
            <p>Address: {settings.address}</p>
            {settings.workshop_location && <p>{settings.workshop_location}</p>}
            <p>Phone: {settings.phone}</p>
            <p>Website: {settings.website}</p>
            {settings.owner && <p>Owner: {settings.owner}</p>}
          </div>

          <div style={styles.party}>
            <h3 style={styles.partyTitle}>Bill To</h3>
            <p style={styles.clientName}>{invoice.client_name}</p>
            {invoice.client_email && <p>{invoice.client_email}</p>}
            {invoice.client_address && <p>{invoice.client_address}</p>}
            {invoice.client_phone && <p>Phone: {invoice.client_phone}</p>}
            {invoice.client_mobile && <p>Mobile: {invoice.client_mobile}</p>}
          </div>
        </div>

        {/* Vehicle Info */}
        {invoice.vehicle_reg && (
          <div style={styles.vehicleInfo}>
            <strong>Vehicle:</strong> {invoice.vehicle_reg}
            {invoice.vehicle_make && ` - ${invoice.vehicle_make}`}
            {invoice.vehicle_model && ` ${invoice.vehicle_model}`}
          </div>
        )}

        {/* Line Items */}
        <div className="table-container">
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' as const }}>DESCRIPTION</th>
                <th style={styles.th}>RATE</th>
                <th style={styles.th}>QTY</th>
                <th style={{ ...styles.th, textAlign: 'right' as const }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items && invoice.line_items.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>
                    {item.description}
                    {item.item_type !== 'service' && (
                      <span style={styles.itemType}> ({item.item_type})</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' as const }}>
                    £{parseFloat(item.rate.toString()).toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' as const }}>
                    {item.quantity}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' as const }}>
                    £{parseFloat(item.amount.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={styles.totalsSection}>
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
            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>£{parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>VAT ({invoice.vat_rate}%)</span>
              <span>£{parseFloat(invoice.vat_amount.toString()).toFixed(2)}</span>
            </div>
            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <span>Total</span>
              <span>£{parseFloat(invoice.total.toString()).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={styles.notesSection}>
            <h3 style={styles.notesTitle}>Notes</h3>
            <p style={styles.notesText}>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p>Thank you for your business!</p>
          <p style={styles.footerSmall}>
            This is an invoice. Final costs may vary based on actual work performed.
          </p>
          <div style={styles.disclaimer}>
            <p style={styles.disclaimerText}>
              AUTOW Services provides mobile mechanics and recovery services. All work is guaranteed for 30 days from completion.
              Parts are subject to manufacturer warranty. Payment terms: Parts and/or vehicle collection/recovery required upfront,
              labour on completion. Unpaid invoices may incur late payment fees. By accepting this estimate, you agree to these terms.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }

        @media (max-width: 900px) {
          .doc-header {
            flex-direction: column !important;
            gap: 20px;
          }
          .doc-header > div:last-child {
            text-align: left !important;
          }
          .parties {
            grid-template-columns: 1fr !important;
          }
          .table-container {
            overflow-x: auto;
          }
          .totals-box {
            min-width: auto !important;
            width: 100%;
          }
        }
      `}</style>
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
  actionBar: {
    maxWidth: '900px',
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
    fontWeight: '600' as const,
  },
  document: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    color: '#000',
    padding: '60px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '3px solid #30ff37',
  },
  docTitle: {
    fontSize: '36px',
    fontWeight: '700' as const,
    color: '#30ff37',
    margin: '0 0 10px 0',
  },
  docNumber: {
    fontSize: '18px',
    fontWeight: '600' as const,
    margin: '0 0 5px 0',
  },
  docDate: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  logo: {
    width: '150px',
    height: 'auto',
  },
  parties: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    marginBottom: '30px',
  },
  party: {
    lineHeight: 1.8,
  },
  partyTitle: {
    fontSize: '14px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: '#666',
    marginBottom: '10px',
    margin: '0 0 10px 0',
  },
  businessName: {
    fontSize: '18px',
    fontWeight: '700' as const,
    margin: '0 0 5px 0',
  },
  clientName: {
    fontSize: '18px',
    fontWeight: '700' as const,
    margin: '0 0 5px 0',
  },
  vehicleInfo: {
    background: '#f8f8f8',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '30px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '30px',
  },
  th: {
    padding: '12px',
    borderBottom: '2px solid #30ff37',
    fontSize: '12px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: '#666',
    textAlign: 'center' as const,
  },
  td: {
    padding: '15px 12px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    background: '#fafafa',
  },
  itemType: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic' as const,
  },
  totalsSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '40px',
  },
  totalsBox: {
    minWidth: '300px',
    background: '#f8f8f8',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#666',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    fontSize: '16px',
  },
  grandTotal: {
    fontSize: '20px',
    fontWeight: '700' as const,
    paddingTop: '15px',
    borderTop: '2px solid #30ff37',
    marginTop: '10px',
    color: '#30ff37',
  },
  notesSection: {
    background: '#f8f8f8',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    border: '1px solid #e0e0e0',
  },
  notesTitle: {
    fontSize: '16px',
    fontWeight: '700' as const,
    marginBottom: '10px',
    margin: '0 0 10px 0',
  },
  notesText: {
    fontSize: '14px',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap' as const,
    margin: '0',
  },
  footer: {
    textAlign: 'center' as const,
    paddingTop: '40px',
    borderTop: '1px solid #e0e0e0',
    color: '#666',
  },
  footerSmall: {
    fontSize: '12px',
    marginTop: '10px',
  },
  disclaimer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
  },
  disclaimerText: {
    fontSize: '9px',
    color: '#999',
    margin: '0',
    lineHeight: 1.4,
    textAlign: 'justify' as const,
  },
  loadingText: {
    fontSize: '18px',
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#666',
  },
  errorText: {
    fontSize: '18px',
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#f44336',
  },
};
