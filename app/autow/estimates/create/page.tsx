'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LineItem } from '@/lib/types';

interface FormData {
  estimate_number: string;
  estimate_date: string;
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

export default function CreateEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const estimateId = searchParams.get('id');
  const mode = estimateId ? 'edit' : 'create';

  const [loading, setLoading] = useState(!!bookingId || !!estimateId);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<LineItem | null>(null);
  const [discountMode, setDiscountMode] = useState<'flat' | 'percentage'>('flat');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [manualEstimateNumber, setManualEstimateNumber] = useState(false); // Track if user manually edited estimate number

  // Vehicle reg popup for new estimates
  const [showVehicleRegModal, setShowVehicleRegModal] = useState(false);
  const [vehicleRegInput, setVehicleRegInput] = useState('');
  const [fetchingNumber, setFetchingNumber] = useState(false);

  const defaultNotes = `We Provide Mobile mechanics and Recovery services,
we have dedicated ramp spaces for works that are not suitable at roadside etc.

OUR TERMS:
PARTS AND / OR VEHICLE COLLECTION/RECOVERY
REQUIRED UPFRONT.

LABOUR ON COMPLETION

Best Regards

Gavin
AuToW Services


BACS DETAILS:
Account Name: Autow Services LTD
S/C: 04-06-05
A/N: 29892012
(Business Account)

Company Number: 16952633`;

  const [formData, setFormData] = useState<FormData>({
    estimate_number: '',
    estimate_date: new Date().toISOString().split('T')[0],
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
    { description: '', item_type: 'service', rate: 0, quantity: 1, amount: 0, sort_order: 0, document_type: 'estimate' }
  ]);

  const [totals, setTotals] = useState({
    parts: 0,
    labor: 0,
    service: 0,
    discount: 0,
    subtotal: 0,
    vat: 0,
    total: 0
  });

  // Fetch preview document number based on vehicle reg
  const fetchDocumentNumber = async (vehicleReg: string, force: boolean = false) => {
    // Don't overwrite if user has manually edited the estimate number (unless forced)
    if (manualEstimateNumber && !force) {
      return;
    }

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(
        `/api/autow/document-number/preview?vehicle_reg=${encodeURIComponent(vehicleReg)}&type=estimate`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, estimate_number: data.document_number }));
      }
    } catch (error) {
      console.error('Error fetching document number:', error);
    }
  };

  // Auto-fill from booking or show vehicle reg modal for new estimates
  useEffect(() => {
    if (bookingId) {
      fetchBooking(bookingId);
    } else if (estimateId) {
      fetchEstimate(estimateId);
    } else {
      // New estimate without booking - show vehicle reg modal first
      setShowVehicleRegModal(true);
      setLoading(false);
    }
  }, [bookingId, estimateId]);

  // Handle vehicle reg modal submit
  const handleVehicleRegSubmit = async () => {
    const upperReg = vehicleRegInput.trim().toUpperCase();
    setFetchingNumber(true);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(
        `/api/autow/document-number/preview?vehicle_reg=${encodeURIComponent(upperReg)}&type=estimate`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          vehicle_reg: upperReg,
          estimate_number: data.document_number
        }));
      }
    } catch (error) {
      console.error('Error fetching document number:', error);
    } finally {
      setFetchingNumber(false);
      setShowVehicleRegModal(false);
    }
  };

  // Skip vehicle reg modal (for estimates without vehicle)
  const handleSkipVehicleReg = async () => {
    setFetchingNumber(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(
        `/api/autow/document-number/preview?vehicle_reg=&type=estimate`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          estimate_number: data.document_number
        }));
      }
    } catch (error) {
      console.error('Error fetching document number:', error);
    } finally {
      setFetchingNumber(false);
      setShowVehicleRegModal(false);
    }
  };

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
        const vehicleReg = booking.vehicle_reg || '';

        setFormData({
          estimate_number: '', // Will be set by fetchDocumentNumber
          estimate_date: new Date().toISOString().split('T')[0],
          client_name: booking.customer_name || '',
          client_email: booking.customer_email || '',
          client_address: `${booking.location_address}, ${booking.location_postcode}`,
          client_phone: booking.customer_phone || '',
          client_mobile: '',
          vehicle_make: booking.vehicle_make || '',
          vehicle_model: booking.vehicle_model || '',
          vehicle_reg: vehicleReg,
          notes: `Service: ${booking.service_type}\n\nIssue: ${booking.issue_description}${booking.notes ? `\n\nNotes: ${booking.notes}` : ''}\n\n---\n\n${defaultNotes}`,
          vat_rate: 0
        });

        // Fetch the auto-generated estimate number based on vehicle reg
        await fetchDocumentNumber(vehicleReg);
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

        setFormData({
          estimate_number: estimate.estimate_number || '',
          estimate_date: estimate.estimate_date || new Date().toISOString().split('T')[0],
          client_name: estimate.client_name || '',
          client_email: estimate.client_email || '',
          client_address: estimate.client_address || '',
          client_phone: estimate.client_phone || '',
          client_mobile: estimate.client_mobile || '',
          vehicle_make: estimate.vehicle_make || '',
          vehicle_model: estimate.vehicle_model || '',
          vehicle_reg: estimate.vehicle_reg || '',
          notes: estimate.notes || '',
          vat_rate: estimate.vat_rate || 0
        });

        if (estimate.line_items && estimate.line_items.length > 0) {
          setLineItems(estimate.line_items.map((item: any, index: number) => ({
            description: item.description,
            item_type: item.item_type,
            rate: parseFloat(item.rate),
            quantity: parseFloat(item.quantity),
            amount: parseFloat(item.amount),
            sort_order: index,
            document_type: 'estimate'
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

  const calculateTotals = () => {
    let parts = 0;
    let labor = 0;
    let service = 0;
    let discount = 0;

    lineItems.forEach(item => {
      const amount = item.rate * item.quantity;
      if (item.item_type === 'part') {
        parts += amount;
      } else if (item.item_type === 'labor') {
        labor += amount;
      } else if (item.item_type === 'service') {
        service += amount;
      } else if (item.item_type === 'discount') {
        // Discounts are stored as positive numbers but subtracted
        discount += Math.abs(amount);
      }
    });

    const subtotal = parts + labor + service - discount;
    const vat = subtotal * (formData.vat_rate / 100);
    const total = subtotal + vat;

    setTotals({ parts, labor, service, discount, subtotal, vat, total });
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

  // Calculate subtotal of non-discount items (for percentage discount calculation)
  const getNonDiscountSubtotal = () => {
    let subtotal = 0;
    lineItems.forEach(item => {
      if (item.item_type !== 'discount') {
        subtotal += item.rate * item.quantity;
      }
    });
    return subtotal;
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    const item = lineItems[index];
    setModalItem({ ...item });

    // Detect if this is a percentage discount (description contains %)
    if (item.item_type === 'discount' && item.description.includes('%')) {
      setDiscountMode('percentage');
      // Extract percentage from description (e.g., "10% Discount" -> 10)
      const match = item.description.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        setDiscountPercentage(parseFloat(match[1]));
      }
    } else {
      setDiscountMode('flat');
      setDiscountPercentage(0);
    }
  };

  const closeModal = () => {
    setEditingIndex(null);
    setModalItem(null);
  };

  const saveModalItem = () => {
    if (editingIndex !== null && modalItem) {
      const updated = [...lineItems];

      // Handle percentage discount
      if (modalItem.item_type === 'discount' && discountMode === 'percentage') {
        const subtotal = getNonDiscountSubtotal();
        const discountAmount = (subtotal * discountPercentage) / 100;
        updated[editingIndex] = {
          ...modalItem,
          description: modalItem.description.includes('%')
            ? modalItem.description
            : `${discountPercentage}% ${modalItem.description || 'Discount'}`,
          rate: discountAmount,
          quantity: 1,
          amount: discountAmount
        };
      } else {
        updated[editingIndex] = {
          ...modalItem,
          amount: modalItem.rate * modalItem.quantity
        };
      }

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
      document_type: 'estimate'
    }]);
  };

  const addDiscount = () => {
    setLineItems([...lineItems, {
      description: 'Discount',
      item_type: 'discount',
      rate: 0,
      quantity: 1,
      amount: 0,
      sort_order: lineItems.length,
      document_type: 'estimate'
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
        ? '/api/autow/estimate/update'
        : '/api/autow/estimate/create';

      const payload = {
        ...formData,
        line_items: lineItems,
        subtotal: totals.subtotal,
        vat_amount: totals.vat,
        total: totals.total,
        ...(mode === 'edit' && { id: estimateId }),
        ...(bookingId && { booking_id: parseInt(bookingId) })
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
        alert(`Estimate ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
        router.push(`/autow/estimates/view?id=${data.estimate.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving estimate:', error);
      alert('Failed to save estimate');
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
      {/* Vehicle Registration Modal - shown first for new estimates */}
      {showVehicleRegModal && (
        <div style={styles.vehicleRegModalOverlay}>
          <div style={styles.vehicleRegModalContent}>
            <h2 style={styles.vehicleRegModalTitle}>New Estimate</h2>
            <p style={styles.vehicleRegModalSubtitle}>
              Enter the vehicle registration to generate the estimate number
            </p>

            <div style={styles.vehicleRegInputGroup}>
              <label style={styles.vehicleRegLabel}>Vehicle Registration</label>
              <input
                type="text"
                value={vehicleRegInput}
                onChange={(e) => setVehicleRegInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && vehicleRegInput.trim()) {
                    handleVehicleRegSubmit();
                  }
                }}
                placeholder="e.g., AB12 CDE"
                style={styles.vehicleRegInput}
                autoFocus
              />
            </div>

            <div style={styles.vehicleRegModalButtons}>
              <button
                type="button"
                onClick={handleSkipVehicleReg}
                style={styles.vehicleRegSkipBtn}
                disabled={fetchingNumber}
              >
                Skip (No Vehicle)
              </button>
              <button
                type="button"
                onClick={handleVehicleRegSubmit}
                style={styles.vehicleRegSubmitBtn}
                disabled={!vehicleRegInput.trim() || fetchingNumber}
              >
                {fetchingNumber ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header at Top */}
      <div style={styles.header}>
        <h1 style={styles.title}>{mode === 'edit' ? 'Edit' : 'Create'} Estimate</h1>
        <button
          onClick={() => router.push('/autow/estimates')}
          style={styles.backButton}
        >
          ← Back to Estimates
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
          <h2 style={styles.businessName}>AUTOW SERVICES LTD</h2>
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
        {/* Estimate Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Estimate Details</h2>
          <div style={styles.formGrid} className="form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>Estimate Number {mode === 'create' && !manualEstimateNumber ? '(Auto-generated)' : ''}</label>
              <input
                type="text"
                value={formData.estimate_number}
                onChange={(e) => {
                  setFormData({ ...formData, estimate_number: e.target.value });
                  if (mode === 'create') {
                    setManualEstimateNumber(true); // User is manually editing
                  }
                }}
                style={{
                  ...styles.input,
                  ...(mode === 'create' && !manualEstimateNumber ? { background: '#1a1a1a', color: '#30ff37', fontWeight: '600' } : {})
                }}
                placeholder={mode === 'create' ? 'Auto-generated or enter custom' : 'e.g., ABC-001'}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Estimate Date *</label>
              <input
                type="date"
                value={formData.estimate_date}
                onChange={(e) => setFormData({ ...formData, estimate_date: e.target.value })}
                style={styles.input}
                required
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

          {/* Mobile: Card View */}
          <div className="mobile-line-items">
            {lineItems.map((item, index) => (
              <div key={index} style={styles.lineItemCard}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>
                    {item.description || 'New Item'}
                    <span style={item.item_type === 'discount' ? styles.discountBadge : styles.itemTypeBadge}>{item.item_type}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    style={styles.cardRemoveBtn}
                    disabled={lineItems.length === 1}
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Rate:</span>
                    <span>£{item.rate.toFixed(2)}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Quantity:</span>
                    <span>{item.quantity}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Amount:</span>
                    <span style={item.item_type === 'discount' ? styles.cardAmountDiscount : styles.cardAmount}>
                      {item.item_type === 'discount' ? '-' : ''}£{item.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(index)}
                  style={styles.cardEditBtn}
                >
                  ✏️ Edit Item
                </button>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="desktop-line-items">
            <div style={styles.lineItemsTable}>
              <div style={styles.tableHeader}>
                <div style={{ flex: 3, minWidth: 0 }}>Description</div>
                <div style={{ flex: 1, minWidth: '70px', flexShrink: 0 }}>Type</div>
                <div style={{ flex: 1, minWidth: '70px', flexShrink: 0 }}>Rate (£)</div>
                <div style={{ flex: 1, minWidth: '50px', flexShrink: 0 }}>Qty</div>
                <div style={{ flex: 1, minWidth: '90px', flexShrink: 0 }}>Amount (£)</div>
                <div style={{ width: '100px', flexShrink: 0 }}></div>
              </div>

              {lineItems.map((item, index) => (
                <div key={index} style={styles.lineItemRow}>
                  <div style={{ flex: 3, minWidth: 0, overflow: 'hidden' }}>
                    <div style={styles.descPreview}>
                      {item.description || 'Click edit to add description'}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '70px', flexShrink: 0 }}>
                    <span style={item.item_type === 'discount' ? styles.discountBadge : styles.itemTypeBadge}>{item.item_type}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: '70px', flexShrink: 0 }}>
                    £{item.rate.toFixed(2)}
                  </div>

                  <div style={{ flex: 1, minWidth: '50px', flexShrink: 0 }}>
                    {item.quantity}
                  </div>

                  <div style={{ flex: 1, minWidth: '90px', flexShrink: 0 }}>
                    <div style={item.item_type === 'discount' ? styles.amountDisplayDiscount : styles.amountDisplay}>
                      {item.item_type === 'discount' ? '-' : ''}£{item.amount.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ width: '100px', display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(index)}
                      style={styles.editButton}
                    >
                      ✏️
                    </button>
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
          </div>

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={addLineItem}
              style={styles.addButton}
            >
              + Add Line Item
            </button>
            <button
              type="button"
              onClick={addDiscount}
              style={styles.addDiscountButton}
            >
              + Add Discount
            </button>
          </div>
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
            {totals.discount > 0 && (
              <div style={styles.discountRow}>
                <span>Discount:</span>
                <span>-£{totals.discount.toFixed(2)}</span>
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
            onClick={() => router.push('/autow/estimates')}
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
            {saving ? 'Saving...' : (mode === 'edit' ? 'Update Estimate' : 'Create Estimate')}
          </button>
        </div>
      </form>

      {/* Line Item Edit Modal */}
      {modalItem && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Line Item</h2>
              <button onClick={closeModal} style={styles.modalClose}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGroup}>
                <label style={styles.label}>Description *</label>
                <textarea
                  value={modalItem.description}
                  onChange={(e) => updateModalItem('description', e.target.value)}
                  style={{ ...styles.input, minHeight: '100px' }}
                  placeholder="Enter item description..."
                />
              </div>

              <div style={styles.modalGroup}>
                <label style={styles.label}>Type</label>
                <select
                  value={modalItem.item_type}
                  onChange={(e) => {
                    updateModalItem('item_type', e.target.value);
                    if (e.target.value !== 'discount') {
                      setDiscountMode('flat');
                      setDiscountPercentage(0);
                    }
                  }}
                  style={styles.input}
                >
                  <option value="service">Service</option>
                  <option value="part">Part</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                  <option value="discount">Discount</option>
                </select>
              </div>

              {/* Discount Mode Toggle - only show when type is discount */}
              {modalItem.item_type === 'discount' && (
                <div style={styles.modalGroup}>
                  <label style={styles.label}>Discount Type</label>
                  <div style={styles.discountModeToggle}>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('flat')}
                      style={discountMode === 'flat' ? styles.discountModeActive : styles.discountModeBtn}
                    >
                      Flat Rate (£)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('percentage')}
                      style={discountMode === 'percentage' ? styles.discountModeActive : styles.discountModeBtn}
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>
              )}

              {/* Percentage input - show when discount + percentage mode */}
              {modalItem.item_type === 'discount' && discountMode === 'percentage' ? (
                <>
                  <div style={styles.modalGroup}>
                    <label style={styles.label}>Discount Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      style={styles.input}
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div style={styles.discountPreview}>
                    <span>Subtotal (excl. discounts):</span>
                    <span>£{getNonDiscountSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={styles.modalAmount}>
                    <span>Discount Amount:</span>
                    <span style={styles.discountAmountValue}>
                      -£{((getNonDiscountSubtotal() * discountPercentage) / 100).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={styles.modalGroup}>
                      <label style={styles.label}>{modalItem.item_type === 'discount' ? 'Discount Amount (£)' : 'Rate (£)'}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={modalItem.rate}
                        onChange={(e) => updateModalItem('rate', parseFloat(e.target.value) || 0)}
                        style={styles.input}
                      />
                    </div>

                    {modalItem.item_type !== 'discount' && (
                      <div style={styles.modalGroup}>
                        <label style={styles.label}>Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          value={modalItem.quantity}
                          onChange={(e) => updateModalItem('quantity', parseFloat(e.target.value) || 0)}
                          style={styles.input}
                        />
                      </div>
                    )}
                  </div>

                  <div style={modalItem.item_type === 'discount' ? styles.modalAmount : styles.modalAmount}>
                    <span>Amount:</span>
                    <span style={modalItem.item_type === 'discount' ? styles.discountAmountValue : styles.modalAmountValue}>
                      {modalItem.item_type === 'discount' ? '-' : ''}£{(modalItem.rate * modalItem.quantity).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeModal} style={styles.modalCancelBtn}>
                Cancel
              </button>
              <button onClick={saveModalItem} style={styles.modalSaveBtn}>
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mobile-line-items {
          display: none;
        }

        .desktop-line-items {
          display: block;
        }

        @media (max-width: 768px) {
          .mobile-line-items {
            display: block !important;
          }

          .desktop-line-items {
            display: none !important;
          }
        }

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
  },
  // Vehicle Registration Modal Styles
  vehicleRegModalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  vehicleRegModalContent: {
    background: '#1a1a1a',
    borderRadius: '16px',
    border: '2px solid rgba(48, 255, 55, 0.3)',
    padding: '40px',
    maxWidth: '450px',
    width: '100%',
    textAlign: 'center' as const,
  },
  vehicleRegModalTitle: {
    color: '#30ff37',
    fontSize: '28px',
    fontWeight: '700' as const,
    margin: '0 0 10px 0',
  },
  vehicleRegModalSubtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '0 0 30px 0',
  },
  vehicleRegInputGroup: {
    textAlign: 'left' as const,
    marginBottom: '30px',
  },
  vehicleRegLabel: {
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '10px',
    display: 'block',
  },
  vehicleRegInput: {
    width: '100%',
    padding: '18px 20px',
    background: '#0a0a0a',
    border: '2px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '10px',
    color: '#30ff37',
    fontSize: '24px',
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '3px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  vehicleRegModalButtons: {
    display: 'flex',
    gap: '15px',
  },
  vehicleRegSkipBtn: {
    flex: 1,
    padding: '15px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
  },
  vehicleRegSubmitBtn: {
    flex: 2,
    padding: '15px 20px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '10px',
    color: '#000',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
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
    padding: '12px',
    background: '#0a0a0a',
    borderRadius: '6px',
  },
  lineItemCard: {
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '8px',
    padding: '15px 16px',
    marginBottom: '15px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
    paddingRight: '10px',
    wordBreak: 'break-word' as const,
  },
  cardRemoveBtn: {
    width: '30px',
    height: '30px',
    background: 'rgba(244, 67, 54, 0.2)',
    border: '1px solid rgba(244, 67, 54, 0.5)',
    borderRadius: '6px',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '16px',
    flexShrink: 0,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '12px',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  cardLabel: {
    color: '#888',
  },
  cardAmount: {
    color: '#30ff37',
    fontWeight: '700' as const,
  },
  cardAmountDiscount: {
    color: '#ff9800',
    fontWeight: '700' as const,
  },
  cardEditBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '6px',
    color: '#30ff37',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  itemTypeBadge: {
    background: 'rgba(48, 255, 55, 0.15)',
    color: '#30ff37',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginLeft: '8px',
  },
  discountBadge: {
    background: 'rgba(255, 152, 0, 0.15)',
    color: '#ff9800',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginLeft: '8px',
  },
  descPreview: {
    fontSize: '14px',
    color: '#fff',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight: 1.4,
  },
  editButton: {
    width: '40px',
    height: '40px',
    background: 'rgba(33, 150, 243, 0.2)',
    border: '1px solid rgba(33, 150, 243, 0.5)',
    borderRadius: '6px',
    color: '#2196f3',
    cursor: 'pointer',
    fontSize: '16px',
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
  amountDisplayDiscount: {
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    borderRadius: '6px',
    color: '#ff9800',
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
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
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
  addDiscountButton: {
    padding: '10px 20px',
    background: 'rgba(255, 152, 0, 0.1)',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    borderRadius: '6px',
    color: '#ff9800',
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
  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#ff9800',
  },
  discountModeToggle: {
    display: 'flex',
    gap: '10px',
  },
  discountModeBtn: {
    flex: 1,
    padding: '10px 15px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  discountModeActive: {
    flex: 1,
    padding: '10px 15px',
    background: 'rgba(255, 152, 0, 0.2)',
    border: '1px solid #ff9800',
    borderRadius: '6px',
    color: '#ff9800',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  discountPreview: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 15px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#888',
  },
  discountAmountValue: {
    fontSize: '20px',
    fontWeight: '700' as const,
    color: '#ff9800',
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
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(48, 255, 55, 0.2)',
  },
  modalTitle: {
    color: '#30ff37',
    fontSize: '20px',
    margin: '0',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '30px',
    height: '30px',
  },
  modalBody: {
    padding: '20px',
  },
  modalGroup: {
    marginBottom: '20px',
  },
  modalAmount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: '#0a0a0a',
    borderRadius: '6px',
    marginTop: '10px',
    fontSize: '16px',
  },
  modalAmountValue: {
    color: '#30ff37',
    fontSize: '20px',
    fontWeight: '700' as const,
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid rgba(48, 255, 55, 0.2)',
  },
  modalCancelBtn: {
    flex: 1,
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  modalSaveBtn: {
    flex: 1,
    padding: '12px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700' as const,
  },
};
