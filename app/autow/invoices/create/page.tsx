'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LineItem } from '@/lib/types';


interface FormData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  client_mobile: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg: string;
  notes: string;
  vat_rate: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const estimateId = searchParams.get('estimate_id');
  const invoiceId = searchParams.get('id');
  const mode = invoiceId ? 'edit' : 'create';

  const [loading, setLoading] = useState(!!bookingId || !!estimateId || !!invoiceId);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<LineItem | null>(null);

  const defaultNotes = `We Provide Mobile mechanics and Recovery services,
we have dedicated ramp spaces for works that are not suitable at roadside etc.

OUR TERMS:
PARTS AND / OR VEHICLE COLLECTION/RECOVERY
REQUIRED UPFRONT.

LABOUR ON COMPLETION

Best Regards

G, AuToW Services


BACS DETAILS:
Account Name: Gavin White
S/C: 04-06-05
A/N: 20052044
(Business Account)`;

  const [formData, setFormData] = useState<FormData>({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client_name: '',
    client_email: '',
    client_address: '',
    client_phone: '',
    client_mobile: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_reg: '',
    notes: defaultNotes,
    vat_rate: 0
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', item_type: 'service', rate: 0, quantity: 1, amount: 0, sort_order: 0, document_type: 'invoice' }
  ]);

  const [totals, setTotals] = useState({
    parts: 0,
    labor: 0,
    service: 0,
    subtotal: 0,
    vat: 0,
    total: 0
  });

  // Auto-fill from booking or estimate
  useEffect(() => {
    if (bookingId) {
      fetchBooking(bookingId);
    } else if (estimateId) {
      fetchEstimate(estimateId);
    } else if (invoiceId) {
      fetchInvoice(invoiceId);
    } else {
      setLoading(false);
    }
  }, [bookingId, estimateId, invoiceId]);

  // Auto-calculate totals when line items change
  useEffect(() => {
    calculateTotals();
  }, [lineItems, formData.vat_rate]);

  const fetchBooking = async (id: string) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/booking/get?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const booking = data.booking;

        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        setFormData({
          invoice_number: '',
          invoice_date: today,
          due_date: dueDateStr,
          client_name: booking.customer_name || '',
          client_email: booking.customer_email || '',
          client_address: `${booking.location_address}, ${booking.location_postcode}`,
          client_phone: booking.customer_phone || '',
          client_mobile: '',
          vehicle_make: booking.vehicle_make || '',
          vehicle_model: booking.vehicle_model || '',
          vehicle_reg: booking.vehicle_reg || '',
          notes: `Service: ${booking.service_type}\n\nIssue: ${booking.issue_description}${booking.notes ? `\n\nNotes: ${booking.notes}` : ''}\n\n---\n\n${defaultNotes}`,
          vat_rate: 0
        });
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstimate = async (id: string) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/estimate/get?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const estimate = data.estimate;

        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        setFormData({
          invoice_number: '',
          invoice_date: today,
          due_date: dueDateStr,
          client_name: estimate.client_name || '',
          client_email: estimate.client_email || '',
          client_address: estimate.client_address || '',
          client_phone: estimate.client_phone || '',
          client_mobile: estimate.client_mobile || '',
          vehicle_make: estimate.vehicle_make || '',
          vehicle_model: estimate.vehicle_model || '',
          vehicle_reg: estimate.vehicle_reg || '',
          notes: estimate.notes || '',
          vat_rate: estimate.vat_rate || 20.00
        });

        if (estimate.line_items && estimate.line_items.length > 0) {
          setLineItems(estimate.line_items.map((item: any, index: number) => ({
            description: item.description,
            item_type: item.item_type,
            rate: parseFloat(item.rate),
            quantity: parseFloat(item.quantity),
            amount: parseFloat(item.amount),
            sort_order: index,
            document_type: 'invoice'
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
      alert('Failed to load estimate data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoice = async (id: string) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/invoice/get?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const invoice = data.invoice;

        setFormData({
          invoice_number: invoice.invoice_number || '',
          invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
          due_date: invoice.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          client_name: invoice.client_name || '',
          client_email: invoice.client_email || '',
          client_address: invoice.client_address || '',
          client_phone: invoice.client_phone || '',
          client_mobile: invoice.client_mobile || '',
          vehicle_make: invoice.vehicle_make || '',
          vehicle_model: invoice.vehicle_model || '',
          vehicle_reg: invoice.vehicle_reg || '',
          notes: invoice.notes || '',
          vat_rate: invoice.vat_rate || 20.00
        });

        if (invoice.line_items && invoice.line_items.length > 0) {
          setLineItems(invoice.line_items.map((item: any, index: number) => ({
            description: item.description,
            item_type: item.item_type,
            rate: parseFloat(item.rate),
            quantity: parseFloat(item.quantity),
            amount: parseFloat(item.amount),
            sort_order: index,
            document_type: 'invoice'
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let parts = 0;
    let labor = 0;
    let service = 0;

    lineItems.forEach(item => {
      const amount = item.rate * item.quantity;
      if (item.item_type === 'part') {
        parts += amount;
      } else if (item.item_type === 'labor') {
        labor += amount;
      } else if (item.item_type === 'service') {
        service += amount;
      }
    });

    const subtotal = parts + labor + service;
    const vat = subtotal * (formData.vat_rate / 100);
    const total = subtotal + vat;

    setTotals({ parts, labor, service, subtotal, vat, total });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate amount
    if (field === 'rate' || field === 'quantity') {
      updated[index].amount = updated[index].rate * updated[index].quantity;
    }

    setLineItems(updated);
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setModalItem({ ...lineItems[index] });
  };

  const closeModal = () => {
    setEditingIndex(null);
    setModalItem(null);
  };

  const saveModalItem = () => {
    if (editingIndex !== null && modalItem) {
      const updated = [...lineItems];
      updated[editingIndex] = {
        ...modalItem,
        amount: modalItem.rate * modalItem.quantity
      };
      setLineItems(updated);
      closeModal();
    }
  };

  const updateModalItem = (field: keyof LineItem, value: any) => {
    if (modalItem) {
      setModalItem({ ...modalItem, [field]: value });
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      description: '',
      item_type: 'service',
      rate: 0,
      quantity: 1,
      amount: 0,
      sort_order: lineItems.length,
      document_type: 'invoice'
    }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      alert('You must have at least one line item');
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name) {
      alert('Client name is required');
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].description) {
      alert('Please add at least one line item');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('autow_token');
      const endpoint = mode === 'edit'
        ? '/api/autow/invoice/update'
        : '/api/autow/invoice/create';

      const payload = {
        ...formData,
        line_items: lineItems,
        subtotal: totals.subtotal,
        vat_amount: totals.vat,
        total: totals.total,
        ...(mode === 'edit' && { id: invoiceId }),
        ...(bookingId && { booking_id: parseInt(bookingId) }),
        ...(estimateId && { estimate_id: parseInt(estimateId) })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Invoice ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
        router.push(`/autow/invoices/view?id=${data.invoice.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    } finally {
      setSaving(false);
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
      {/* Header at Top */}
      <div style={styles.header}>
        <h1 style={styles.title}>{mode === 'edit' ? 'Edit' : 'Create'} Invoice</h1>
        <button
          onClick={() => router.push('/autow/invoices')}
          style={styles.backButton}
        >
          ← Back to Invoices
        </button>
      </div>

      {/* Business Header */}
      <div style={styles.businessHeader}>
        <img
          src="https://autow-services.co.uk/logo.png"
          alt="AUTOW Services"
          style={styles.headerLogo}
        />
        <div style={styles.businessInfo}>
          <h2 style={styles.businessName}>AUTOW SERVICES</h2>
          <p style={styles.businessDetails}>
            Email: info@autow-services.co.uk | Phone: 07352968276
            <br />
            Address: Alverton, Penzance, TR18 4QB | WORKSHOP LOCATION PENZANCE
            <br />
            Website: https://www.autow-services.co.uk
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Invoice Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Invoice Details</h2>
          <div style={styles.formGrid} className="form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>Invoice Number *</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                style={styles.input}
                placeholder="e.g., ABC-001"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Invoice Date *</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Bill To</h2>
          <div style={styles.formGrid} className="form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>Client Name *</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mobile</label>
              <input
                type="tel"
                value={formData.client_mobile}
                onChange={(e) => setFormData({ ...formData, client_mobile: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Address</label>
              <textarea
                value={formData.client_address}
                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                style={{ ...styles.input, minHeight: '80px' }}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Vehicle Details</h2>
          <div style={styles.formGrid} className="form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>Registration</label>
              <input
                type="text"
                value={formData.vehicle_reg}
                onChange={(e) => setFormData({ ...formData, vehicle_reg: e.target.value.toUpperCase() })}
                onBlur={(e) => setFormData({ ...formData, vehicle_reg: e.target.value.toUpperCase() })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Make</label>
              <input
                type="text"
                value={formData.vehicle_make}
                onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Model</label>
              <input
                type="text"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Line Items</h2>

          <div style={styles.lineItemsTable}>
            <div style={styles.tableHeader}>
              <div style={{ flex: 3 }}>Description</div>
              <div style={{ flex: 1 }}>Type</div>
              <div style={{ flex: 1 }}>Rate (£)</div>
              <div style={{ flex: 1 }}>Qty</div>
              <div style={{ flex: 1 }}>Amount (£)</div>
              <div style={{ width: '60px' }}></div>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} style={styles.lineItemRow}>
                <div style={{ flex: 3 }}>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    style={{ ...styles.input, minHeight: '50px', width: '100%' }}
                    placeholder="Enter description..."
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <select
                    value={item.item_type}
                    onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                    style={styles.input}
                  >
                    <option value="service">Service</option>
                    <option value="part">Part</option>
                    <option value="labor">Labor</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    style={styles.input}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={styles.input}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={styles.amountDisplay}>
                    £{(item.rate * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div style={{ width: '60px' }}>
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    style={styles.removeButton}
                    disabled={lineItems.length === 1}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLineItem}
            style={styles.addButton}
          >
            + Add Line Item
          </button>
        </div>

        {/* Totals */}
        <div style={styles.totalsSection} className="totals-section">
          <div style={styles.totalsBox} className="totals-box">
            {totals.parts > 0 && (
              <div style={styles.breakdownRow}>
                <span>Parts Total:</span>
                <span>£{totals.parts.toFixed(2)}</span>
              </div>
            )}
            {totals.labor > 0 && (
              <div style={styles.breakdownRow}>
                <span>Labour Total:</span>
                <span>£{totals.labor.toFixed(2)}</span>
              </div>
            )}
            {totals.service > 0 && (
              <div style={styles.breakdownRow}>
                <span>Service Total:</span>
                <span>£{totals.service.toFixed(2)}</span>
              </div>
            )}

            <div style={styles.totalRow}>
              <span>Subtotal:</span>
              <span>£{totals.subtotal.toFixed(2)}</span>
            </div>

            <div style={styles.totalRow}>
              <span>
                VAT (
                <input
                  type="number"
                  step="0.01"
                  value={formData.vat_rate}
                  onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
                  style={styles.vatInput}
                  className="vat-input"
                />
                %):
              </span>
              <span>£{totals.vat.toFixed(2)}</span>
            </div>

            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <span>TOTAL:</span>
              <span>£{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={{ ...styles.input, minHeight: '120px', width: '100%' }}
            placeholder="Additional notes, terms, payment details..."
          />
        </div>

        {/* Submit */}
        <div style={styles.submitSection} className="submit-section">
          <button
            type="button"
            onClick={() => router.push('/autow/invoices')}
            style={styles.cancelButton}
            className="cancel-btn"
          >
            Cancel
          </button>

          <button
            type="submit"
            style={styles.submitButton}
            disabled={saving}
            className="submit-btn"
          >
            {saving ? 'Saving...' : (mode === 'edit' ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </form>

      <style>{`
        /* Mobile responsive inputs */
        @media (max-width: 768px) {
          input, textarea, select {
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* VAT input specific sizing */
          .vat-input {
            width: 25% !important;
            max-width: 25% !important;
          }

          /* Stack form grid on mobile */
          .form-grid {
            grid-template-columns: 1fr !important;
          }

          /* Fix totals box on mobile */
          .totals-section {
            justify-content: flex-start !important;
            padding: 0 !important;
          }

          .totals-box {
            min-width: 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 15px !important;
          }

          /* Submit buttons on mobile */
          .submit-section {
            flex-direction: column !important;
            gap: 10px !important;
          }

          .cancel-btn, .submit-btn {
            width: 100% !important;
            padding: 10px 16px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
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
  businessHeader: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px 30px',
    marginBottom: '20px',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '15px',
  },
  headerLogo: {
    height: '60px',
    width: 'auto',
  },
  businessInfo: {
    width: '100%',
  },
  businessName: {
    color: '#30ff37',
    fontSize: '14.4px',
    margin: '0 0 8px 0',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  businessDetails: {
    color: '#888',
    fontSize: '13px',
    margin: '0',
    lineHeight: 1.6,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  title: {
    color: '#30ff37',
    fontSize: '19.2px',
    margin: '0',
  },
  backButton: {
    padding: '5px 10px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  form: {
    maxWidth: '1200px',
  },
  section: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '30px 10px',
    marginBottom: '30px',
    border: '1px solid rgba(48, 255, 55, 0.2)',
  },
  sectionTitle: {
    color: '#30ff37',
    fontSize: '20px',
    marginBottom: '20px',
    margin: '0 0 20px 0',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '8px',
    fontWeight: '600' as const,
  },
  input: {
    padding: '12px 13px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    maxWidth: '100%',
  },
  lineItemsTable: {
    marginBottom: '20px',
  },
  tableHeader: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    background: '#0a0a0a',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '12px',
    color: '#888',
    fontWeight: '700' as const,
  },
  lineItemRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    alignItems: 'flex-start',
  },
  amountDisplay: {
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '6px',
    color: '#30ff37',
    fontSize: '14px',
    fontWeight: '700' as const,
    textAlign: 'right' as const,
  },
  removeButton: {
    width: '40px',
    height: '40px',
    background: 'rgba(244, 67, 54, 0.2)',
    border: '1px solid rgba(244, 67, 54, 0.5)',
    borderRadius: '6px',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '18px',
  },
  addButton: {
    padding: '10px 20px',
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '6px',
    color: '#30ff37',
    cursor: 'pointer',
    fontSize: '14px',
  },
  totalsSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '30px',
    width: '100%',
  },
  totalsBox: {
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    minWidth: '350px',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#888',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '16px',
    color: '#fff',
  },
  grandTotal: {
    fontSize: '20px',
    fontWeight: '700' as const,
    color: '#30ff37',
    paddingTop: '12px',
    borderTop: '2px solid rgba(48, 255, 55, 0.3)',
    marginTop: '12px',
  },
  vatInput: {
    width: '28px',
    padding: '2px 2px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '13px',
    textAlign: 'center' as const,
  },
  submitSection: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '14px 32px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600' as const,
  },
  submitButton: {
    padding: '14px 32px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700' as const,
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
