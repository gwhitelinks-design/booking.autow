'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Invoice, InvoiceExpense } from '@/lib/types';


export default function ViewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Expenses state
  const [expenses, setExpenses] = useState<InvoiceExpense[]>([]);
  const [expenseTotals, setExpenseTotals] = useState({ parts: 0, labour: 0, total: 0 });
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseImageData, setExpenseImageData] = useState<string | null>(null);
  const [scanningExpense, setScanningExpense] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseScanned, setExpenseScanned] = useState(false);
  const [expenseConfidence, setExpenseConfidence] = useState<number | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // Expense form fields
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseRefNumber, setExpenseRefNumber] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePartsAmount, setExpensePartsAmount] = useState('0');
  const [expenseLabourAmount, setExpenseLabourAmount] = useState('0');
  const [expenseCategory, setExpenseCategory] = useState('general');

  // Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) {
      router.push('/autow/invoices');
      return;
    }

    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/invoice/get?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice.invoice || data.invoice);
        setBusinessSettings(data.invoice.business_settings);
      } else {
        alert('Failed to load invoice');
        router.push('/autow/invoices');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/mark-as-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoice_id: id })
      });

      if (response.ok) {
        alert('Invoice marked as paid!');
        fetchInvoice(); // Reload to update status
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to mark as paid');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Fetch expenses for this invoice
  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/invoice/expense/list?invoice_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        setExpenseTotals(data.totals || { parts: 0, labour: 0, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Parse expense image with OCR
  const parseExpenseImage = async (imgData: string) => {
    setScanningExpense(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/expense/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ imageData: imgData }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const extracted = data.data;
        const filledFields = new Set<string>();

        if (extracted.supplier) {
          setExpenseSupplier(extracted.supplier);
          filledFields.add('supplier');
        }
        if (extracted.reference_number) {
          setExpenseRefNumber(extracted.reference_number);
          filledFields.add('reference_number');
        }
        if (extracted.expense_date) {
          setExpenseDate(extracted.expense_date);
          filledFields.add('expense_date');
        }
        if (extracted.description) {
          setExpenseDescription(extracted.description);
          filledFields.add('description');
        }
        if (extracted.parts_amount > 0) {
          setExpensePartsAmount(extracted.parts_amount.toString());
          filledFields.add('parts_amount');
        }
        if (extracted.labour_amount > 0) {
          setExpenseLabourAmount(extracted.labour_amount.toString());
          filledFields.add('labour_amount');
        }
        if (extracted.category) {
          setExpenseCategory(extracted.category);
          filledFields.add('category');
        }

        setAutoFilledFields(filledFields);
        setExpenseConfidence(extracted.confidence);
        setExpenseScanned(true);
      }
    } catch (error) {
      console.error('Error parsing expense:', error);
      setExpenseScanned(true);
    } finally {
      setScanningExpense(false);
    }
  };

  // Handle file selection for expense
  const handleExpenseFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgData = event.target?.result as string;
        setExpenseImageData(imgData);
        await parseExpenseImage(imgData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset expense form - pre-populate with invoice data
  const resetExpenseForm = () => {
    setExpenseImageData(null);

    // Calculate breakdown from invoice line items (parts and labour/services combined)
    let partsTotal = 0;
    let labourTotal = 0; // Includes labour and services

    invoice?.line_items?.forEach((item: any) => {
      const amount = parseFloat(item.amount?.toString() || '0');
      if (item.item_type === 'part') {
        partsTotal += amount;
      } else if (item.item_type !== 'discount') {
        // labour, service, and other all go to labour
        labourTotal += amount;
      }
    });

    // Pre-populate fields from invoice
    setExpenseSupplier('');
    setExpenseRefNumber(invoice?.invoice_number || '');

    // Use invoice date if available, otherwise today's date
    const invoiceDate = invoice?.invoice_date
      ? new Date(invoice.invoice_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setExpenseDate(invoiceDate);

    setExpenseDescription(invoice?.client_name ? `Invoice for ${invoice.client_name}` : '');
    setExpensePartsAmount(partsTotal.toFixed(2));
    setExpenseLabourAmount(labourTotal.toFixed(2));
    setExpenseCategory('mixed');
    setExpenseScanned(false);
    setExpenseConfidence(null);
    setAutoFilledFields(new Set(['reference_number', 'expense_date', 'parts_amount', 'labour_amount', 'description']));
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save expense
  const handleSaveExpense = async () => {
    setSavingExpense(true);
    try {
      const token = localStorage.getItem('autow_token');
      const totalAmount =
        parseFloat(expensePartsAmount) +
        parseFloat(expenseLabourAmount);

      const response = await fetch('/api/autow/invoice/expense/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_id: id,
          expense_date: expenseDate || null,
          supplier: expenseSupplier || null,
          reference_number: expenseRefNumber || null,
          description: expenseDescription || null,
          parts_amount: parseFloat(expensePartsAmount) || 0,
          labour_amount: parseFloat(expenseLabourAmount) || 0,
          total_amount: totalAmount,
          category: expenseCategory,
          confidence_score: expenseConfidence,
        }),
      });

      if (response.ok) {
        alert('Expense saved successfully!');
        setShowExpenseModal(false);
        resetExpenseForm();
        fetchExpenses();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    } finally {
      setSavingExpense(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/expense/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: expenseId }),
      });

      if (response.ok) {
        fetchExpenses();
      } else {
        alert('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Fetch expenses when invoice loads
  useEffect(() => {
    if (id && !loading) {
      fetchExpenses();
    }
  }, [id, loading]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return <div style={styles.container}>Invoice not found</div>;
  }

  // Calculate breakdown by item type
  const breakdown = {
    parts: 0,
    service: 0,
    labor: 0,
    other: 0,
    discount: 0
  };

  invoice.line_items?.forEach((item) => {
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
      {/* Action Buttons (don't print) */}
      <div style={styles.actionBar} className="no-print action-bar">
        <button onClick={() => router.push('/autow/invoices')} style={styles.backBtn}>
          ← Back to Invoices
        </button>
        <div style={styles.actionButtons} className="action-buttons">
          <button onClick={() => router.push(`/autow/invoices/edit?id=${id}`)} style={styles.editBtn}>
            ✏️ Edit
          </button>
          {invoice.status === 'pending' && (
            <button onClick={handleMarkAsPaid} style={styles.paidBtn}>
              ✓ Mark as Paid
            </button>
          )}
          <button onClick={() => { resetExpenseForm(); setShowExpenseModal(true); }} style={styles.expenseBtn}>
            💰 Add Expenses
          </button>
          <button onClick={handlePrint} style={styles.printBtn}>
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* Hidden file inputs for expense capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleExpenseFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleExpenseFileSelect}
        style={{ display: 'none' }}
      />

      {/* Expense Modal */}
      {showExpenseModal && (
        <div style={styles.expenseModal}>
          <div style={styles.expenseModalContent}>
            <div style={styles.expenseModalHeader}>
              <h2 style={styles.expenseModalTitle}>Add Expense</h2>
              <button
                onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}
                style={styles.expenseModalClose}
              >
                ✕
              </button>
            </div>

            {/* Loading overlay */}
            {scanningExpense && (
              <div style={styles.scanningOverlay}>
                <div style={styles.spinner}></div>
                <p style={{ color: '#30ff37', marginTop: '15px' }}>Scanning document...</p>
              </div>
            )}

            {/* Image capture section */}
            {!expenseImageData ? (
              <div style={styles.captureSection}>
                <p style={{ color: '#888', marginBottom: '20px' }}>
                  Capture or upload a supplier invoice/receipt to auto-extract data
                </p>
                <div style={styles.captureButtons}>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    style={styles.captureBtn}
                  >
                    📷 Take Photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.uploadBtn}
                  >
                    📁 Upload File
                  </button>
                </div>
                <p style={{ color: '#666', fontSize: '12px', marginTop: '20px' }}>
                  Or fill in the form manually below
                </p>
              </div>
            ) : (
              <div style={styles.imagePreviewSection}>
                <img src={expenseImageData} alt="Expense" style={styles.expenseImagePreview} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={resetExpenseForm} style={styles.clearImageBtn}>
                    Clear
                  </button>
                  <button onClick={() => parseExpenseImage(expenseImageData)} style={styles.rescanBtn}>
                    Re-scan
                  </button>
                </div>
              </div>
            )}

            {/* Confidence banner */}
            {expenseScanned && expenseConfidence !== null && (
              <div style={styles.confidenceBanner}>
                <span>AI extracted data</span>
                <span style={styles.confidenceScore}>{Math.round(expenseConfidence * 100)}%</span>
              </div>
            )}

            {/* Expense form */}
            <div style={styles.expenseForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Supplier {autoFilledFields.has('supplier') && <span style={styles.autoFillBadge}>Auto</span>}
                  </label>
                  <input
                    type="text"
                    value={expenseSupplier}
                    onChange={(e) => setExpenseSupplier(e.target.value)}
                    placeholder="e.g., GSF Car Parts"
                    style={autoFilledFields.has('supplier') ? styles.inputAutoFilled : styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Reference # {autoFilledFields.has('reference_number') && <span style={styles.autoFillBadge}>Auto</span>}
                  </label>
                  <input
                    type="text"
                    value={expenseRefNumber}
                    onChange={(e) => setExpenseRefNumber(e.target.value)}
                    placeholder="Invoice number"
                    style={autoFilledFields.has('reference_number') ? styles.inputAutoFilled : styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Date {autoFilledFields.has('expense_date') && <span style={styles.autoFillBadge}>Auto</span>}
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    style={autoFilledFields.has('expense_date') ? styles.inputAutoFilled : styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    style={styles.formSelect}
                  >
                    <option value="general">General</option>
                    <option value="parts">Parts</option>
                    <option value="labour">Labour</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Description {autoFilledFields.has('description') && <span style={styles.autoFillBadge}>Auto</span>}
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Brief description of expense"
                  style={autoFilledFields.has('description') ? styles.inputAutoFilled : styles.formInput}
                />
              </div>

              <div style={styles.amountsGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Parts £ {autoFilledFields.has('parts_amount') && <span style={styles.autoFillBadge}>Auto</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expensePartsAmount}
                    onChange={(e) => setExpensePartsAmount(e.target.value)}
                    style={autoFilledFields.has('parts_amount') ? styles.inputAutoFilled : styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Labour £ {autoFilledFields.has('labour_amount') && <span style={styles.autoFillBadge}>Auto</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseLabourAmount}
                    onChange={(e) => setExpenseLabourAmount(e.target.value)}
                    style={autoFilledFields.has('labour_amount') ? styles.inputAutoFilled : styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.expenseTotalRow}>
                <span>Total:</span>
                <span style={{ color: '#30ff37', fontWeight: 'bold' }}>
                  £{(
                    parseFloat(expensePartsAmount || '0') +
                    parseFloat(expenseLabourAmount || '0')
                  ).toFixed(2)}
                </span>
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExpense}
                  disabled={savingExpense}
                  style={styles.saveExpenseBtn}
                >
                  {savingExpense ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document */}
      <div style={styles.document} className="document">
        {/* Header */}
        <div style={styles.docHeader} className="doc-header">
          <div>
            <h1 style={styles.docTitle}>INVOICE</h1>
            <p style={styles.docNumber}><strong>{invoice.invoice_number}</strong></p>
            <p style={styles.docDate}>Date: {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</p>
            {invoice.due_date && (
              <p style={styles.docDate}>Due: {new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
            )}
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
            <p style={styles.partyText}>Email: {settings.email}</p>
            <p style={styles.partyText}>Address: {settings.address}</p>
            {settings.workshop_location && <p style={styles.partyText}>{settings.workshop_location}</p>}
            <p style={styles.partyText}>Phone: {settings.phone}</p>
            <p style={styles.partyText}>Website: {settings.website}</p>
            {settings.owner && <p style={styles.partyText}>Owner: {settings.owner}</p>}
          </div>

          <div style={styles.party}>
            <h3 style={styles.partyTitle}>Bill To</h3>
            <p style={styles.clientName}>{invoice.client_name}</p>
            {invoice.client_email && <p style={styles.partyText}>{invoice.client_email}</p>}
            {invoice.client_address && <p style={styles.partyText}>{invoice.client_address}</p>}
            {invoice.client_phone && <p style={styles.partyText}>Phone: {invoice.client_phone}</p>}
            {invoice.client_mobile && <p style={styles.partyText}>Mobile: {invoice.client_mobile}</p>}
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
              <th style={{ ...styles.th, textAlign: 'left' as const }} className="desc-col">DESCRIPTION</th>
              <th style={styles.th} className="rate-col">RATE</th>
              <th style={styles.th} className="qty-col">QTY</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }} className="amount-col">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items && invoice.line_items.map((item, index) => (
              <tr key={index}>
                <td style={styles.td} className="desc-col">
                  {item.description}
                  {item.item_type !== 'service' && (
                    <span style={item.item_type === 'discount' ? styles.discountType : styles.itemType}> ({item.item_type})</span>
                  )}
                </td>
                <td style={{ ...styles.td, textAlign: 'center' as const }} className="rate-col">
                  £{parseFloat(item.rate.toString()).toFixed(2)}
                </td>
                <td style={{ ...styles.td, textAlign: 'center' as const }} className="qty-col">
                  {item.quantity}
                </td>
                <td style={{ ...styles.td, textAlign: 'right' as const, ...(item.item_type === 'discount' ? { color: '#ff9800' } : {}) }} className="amount-col">
                  {item.item_type === 'discount' ? '-' : ''}£{parseFloat(item.amount.toString()).toFixed(2)}
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
            {breakdown.discount > 0 && (
              <div style={styles.discountRow}>
                <span>Discount</span>
                <span>-£{breakdown.discount.toFixed(2)}</span>
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
            {parseFloat(invoice.amount_paid.toString()) > 0 && (
              <>
                <div style={styles.totalRow}>
                  <span>Amount Paid</span>
                  <span>£{parseFloat(invoice.amount_paid.toString()).toFixed(2)}</span>
                </div>
                <div style={{ ...styles.totalRow, ...styles.balanceDue }}>
                  <span>Balance Due</span>
                  <span>£{parseFloat(invoice.balance_due.toString()).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Status */}
        {invoice.status === 'paid' && (
          <div style={styles.paidBanner} className="paid-banner">
            ✓ PAID IN FULL
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={styles.notesSection} className="notes-section">
            <h3 style={styles.notesTitle}>Notes</h3>
            <p style={styles.notesText}>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer} className="footer">
          <p>Thank you for your business!</p>
          <p style={styles.footerSmall}>
            Payment is due by {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : '30 days from invoice date'}.
          </p>
          <div style={styles.disclaimer} className="disclaimer">
            <p style={styles.disclaimerText}>
              AUTOW Services provides mobile mechanics and recovery services. All work is guaranteed for 30 days from completion.
              Parts are subject to manufacturer warranty. Payment terms: Parts and/or vehicle collection/recovery required upfront,
              labour on completion. Unpaid invoices may incur late payment fees of 8% per annum. By accepting this invoice, you agree to these terms.
              For disputes, please contact us within 7 days of invoice date.
            </p>
          </div>
        </div>
      </div>

      {/* Expenses Section (Staff only - don't print) */}
      {expenses.length > 0 && (
        <div style={styles.expensesSection} className="no-print">
          <h2 style={styles.expensesSectionTitle}>💰 Linked Expenses</h2>
          <p style={styles.expensesSectionSubtitle}>
            Supplier invoices and receipts linked to this job
          </p>

          <div style={styles.expensesList}>
            {expenses.map((expense) => (
              <div key={expense.id} style={styles.expenseCard}>
                <div style={styles.expenseCardHeader}>
                  <div>
                    <span style={styles.expenseSupplier}>{expense.supplier || 'Unknown Supplier'}</span>
                    {expense.reference_number && (
                      <span style={styles.expenseRef}> #{expense.reference_number}</span>
                    )}
                  </div>
                  <span style={styles.expenseDate}>
                    {expense.expense_date
                      ? new Date(expense.expense_date).toLocaleDateString('en-GB')
                      : 'No date'}
                  </span>
                </div>

                {expense.description && (
                  <p style={styles.expenseDescription}>{expense.description}</p>
                )}

                <div style={styles.expenseAmounts}>
                  {parseFloat(String(expense.parts_amount)) > 0 && (
                    <span style={styles.expenseAmountItem}>
                      Parts: £{parseFloat(String(expense.parts_amount)).toFixed(2)}
                    </span>
                  )}
                  {parseFloat(String(expense.labour_amount)) > 0 && (
                    <span style={styles.expenseAmountItem}>
                      Labour: £{parseFloat(String(expense.labour_amount)).toFixed(2)}
                    </span>
                  )}
                </div>

                <div style={styles.expenseCardFooter}>
                  <span style={styles.expenseTotal}>
                    Total: £{parseFloat(String(expense.total_amount)).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id!)}
                    style={styles.deleteExpenseBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Expenses Summary */}
          <div style={styles.expensesSummary}>
            <div style={styles.summaryRow}>
              <span>Total Parts Cost:</span>
              <span>£{expenseTotals.parts.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Total Labour Cost:</span>
              <span>£{expenseTotals.labour.toFixed(2)}</span>
            </div>
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Total Expenses:</span>
              <span>£{expenseTotals.total.toFixed(2)}</span>
            </div>
            <div style={styles.profitRow}>
              <span>Invoice Total:</span>
              <span>£{parseFloat(invoice.total.toString()).toFixed(2)}</span>
            </div>
            <div style={styles.profitRow}>
              <span>Estimated Profit:</span>
              <span style={{
                color: parseFloat(invoice.total.toString()) - expenseTotals.total >= 0 ? '#30ff37' : '#ff4444'
              }}>
                £{(parseFloat(invoice.total.toString()) - expenseTotals.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Button when no expenses */}
      {expenses.length === 0 && (
        <div style={styles.noExpensesSection} className="no-print">
          <p style={{ color: '#888', marginBottom: '15px' }}>No expenses linked to this invoice</p>
          <button
            onClick={() => { resetExpenseForm(); setShowExpenseModal(true); }}
            style={styles.addFirstExpenseBtn}
          >
            💰 Add First Expense
          </button>
        </div>
      )}


      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }

        @media (max-width: 768px) {
          /* Mobile styles */
          .action-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .action-buttons {
            flex-direction: column !important;
          }
          .action-buttons button {
            width: 100% !important;
          }
        }

        @media (max-width: 900px) {
          /* Document responsive */
          .document {
            padding: 30px 15px !important;
          }

          .doc-header {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 10px;
          }
          .doc-header > div:first-child {
            flex: 1;
          }
          .doc-header > div:last-child {
            text-align: right !important;
            flex-shrink: 0;
          }
          .doc-header img {
            width: 80px !important;
          }
          .doc-header h1 {
            font-size: 24px !important;
            margin-bottom: 5px !important;
          }
          .doc-header p {
            font-size: 12px !important;
          }
          .parties {
            grid-template-columns: 1fr !important;
          }
          .table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .totals-box {
            min-width: auto !important;
            width: 100%;
          }
        }

        /* Small mobile (480px and below) */
        @media (max-width: 480px) {
          .document {
            padding: 20px 12px !important;
            border-radius: 8px !important;
          }
          .doc-header h1 {
            font-size: 28px !important;
          }
          .doc-header img {
            width: 120px !important;
          }
          .parties {
            gap: 20px !important;
          }
          .parties p {
            font-size: 13px !important;
            word-break: break-word;
          }
          .table-container table {
            font-size: 12px !important;
            table-layout: fixed !important;
            width: 100% !important;
          }
          .table-container th.desc-col,
          .table-container td.desc-col {
            width: 55% !important;
            word-wrap: break-word !important;
            white-space: normal !important;
          }
          .table-container th.rate-col,
          .table-container td.rate-col {
            width: 15% !important;
            font-size: 10px !important;
            padding: 8px 2px !important;
          }
          .table-container th.qty-col,
          .table-container td.qty-col {
            width: 10% !important;
            font-size: 10px !important;
            padding: 8px 2px !important;
          }
          .table-container th.amount-col,
          .table-container td.amount-col {
            width: 20% !important;
            font-size: 10px !important;
            padding: 8px 2px !important;
          }
          .table-container th,
          .table-container td {
            padding: 8px 4px !important;
          }
          .totals-box {
            padding: 15px !important;
          }
          .totals-box span {
            font-size: 13px !important;
          }
          .paid-banner {
            font-size: 18px !important;
            padding: 15px !important;
          }
          .notes-section {
            padding: 15px !important;
          }
          .notes-section p {
            font-size: 13px !important;
          }
          .footer p {
            font-size: 12px !important;
          }
          .disclaimer p {
            font-size: 8px !important;
          }
        }

        /* Extra small mobile (360px and below) */
        @media (max-width: 360px) {
          .document {
            padding: 15px 10px !important;
          }
          .doc-header h1 {
            font-size: 24px !important;
          }
          .doc-header img {
            width: 100px !important;
          }
          .parties p {
            font-size: 12px !important;
          }
          .table-container th.desc-col,
          .table-container td.desc-col {
            width: 50% !important;
            font-size: 10px !important;
          }
          .table-container th.rate-col,
          .table-container td.rate-col,
          .table-container th.qty-col,
          .table-container td.qty-col,
          .table-container th.amount-col,
          .table-container td.amount-col {
            font-size: 9px !important;
            padding: 6px 1px !important;
          }
          .table-container th,
          .table-container td {
            padding: 6px 2px !important;
            font-size: 10px !important;
          }
          .totals-box span {
            font-size: 12px !important;
          }
          .paid-banner {
            font-size: 16px !important;
            padding: 12px !important;
          }
        }

        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          .document {
            -webkit-text-size-adjust: 100%;
          }
          .table-container {
            -webkit-overflow-scrolling: touch;
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
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
  },
  backBtn: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  editBtn: {
    padding: '10px 20px',
    background: '#2196f3',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  paidBtn: {
    padding: '10px 20px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700' as const,
  },
  printBtn: {
    padding: '10px 20px',
    background: 'rgba(48, 255, 55, 0.2)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '8px',
    color: '#30ff37',
    cursor: 'pointer',
    fontSize: '14px',
  },
  document: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    color: '#000',
    padding: '60px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(48, 255, 55, 0.2)',
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
  docNumber: {
    fontSize: '18px',
    color: '#30ff37',
    margin: '5px 0',
    fontFamily: 'monospace',
  },
  logo: {
    width: '150px',
    height: 'auto',
  },
  parties: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '20px',
  },
  party: {
    lineHeight: 1.4,
    fontSize: '12px',
  },
  partyTitle: {
    fontSize: '11px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: '#666',
    marginBottom: '6px',
    margin: '0 0 6px 0',
    letterSpacing: '0.5px',
  },
  businessName: {
    fontSize: '13px',
    fontWeight: '700' as const,
    margin: '0 0 2px 0',
  },
  clientName: {
    fontSize: '13px',
    fontWeight: '700' as const,
    margin: '0 0 2px 0',
  },
  partyText: {
    fontSize: '11px',
    margin: '0 0 1px 0',
    color: '#444',
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
  discountType: {
    fontSize: '12px',
    color: '#ff9800',
    fontStyle: 'italic' as const,
    fontWeight: '600' as const,
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
  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#ff9800',
    fontWeight: '600' as const,
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
  balanceDue: {
    fontSize: '18px',
    fontWeight: '700' as const,
    paddingTop: '15px',
    borderTop: '2px solid #ff3030',
    marginTop: '10px',
    color: '#ff3030',
  },
  paidBanner: {
    background: '#30ff37',
    color: '#000',
    textAlign: 'center' as const,
    padding: '20px',
    fontSize: '24px',
    fontWeight: '700' as const,
    borderRadius: '8px',
    marginBottom: '30px',
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
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  // Expense Button
  expenseBtn: {
    padding: '10px 20px',
    background: 'rgba(255, 152, 0, 0.2)',
    border: '1px solid rgba(255, 152, 0, 0.4)',
    borderRadius: '8px',
    color: '#ff9800',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  // Expense Modal Styles
  expenseModal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '20px',
    overflowY: 'auto' as const,
    zIndex: 1000,
  },
  expenseModalContent: {
    background: '#111',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    padding: '25px',
    marginTop: '20px',
    marginBottom: '20px',
  },
  expenseModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333',
  },
  expenseModalTitle: {
    color: '#ff9800',
    fontSize: '20px',
    fontWeight: '700' as const,
    margin: 0,
  },
  expenseModalClose: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px',
  },
  scanningOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12px',
    zIndex: 10,
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #333',
    borderTopColor: '#30ff37',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  captureSection: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    border: '2px dashed #333',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  captureButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  captureBtn: {
    background: '#30ff37',
    color: '#000',
    border: 'none',
    padding: '15px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700' as const,
  },
  uploadBtn: {
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '15px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  imagePreviewSection: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  expenseImagePreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  clearImageBtn: {
    background: '#ff4444',
    color: '#fff',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  rescanBtn: {
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '8px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  confidenceBanner: {
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '8px',
    padding: '10px 15px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#30ff37',
    fontSize: '13px',
  },
  confidenceScore: {
    background: '#30ff37',
    color: '#000',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700' as const,
  },
  autoFillBadge: {
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '8px',
    marginLeft: '8px',
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
  },
  expenseForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  formLabel: {
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  formInput: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
  },
  inputAutoFilled: {
    background: '#1a1a1a',
    border: '1px solid rgba(48, 255, 55, 0.4)',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
  },
  formSelect: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  amountsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  expenseTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    background: '#1a1a1a',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#fff',
  },
  modalActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  cancelBtn: {
    flex: 1,
    background: '#333',
    color: '#fff',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  saveExpenseBtn: {
    flex: 1,
    background: '#ff9800',
    color: '#000',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700' as const,
  },
  // Expenses Section Styles
  expensesSection: {
    maxWidth: '900px',
    margin: '30px auto 0',
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '25px',
    border: '1px solid rgba(255, 152, 0, 0.3)',
  },
  expensesSectionTitle: {
    color: '#ff9800',
    fontSize: '20px',
    margin: '0 0 5px 0',
  },
  expensesSectionSubtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '0 0 20px 0',
  },
  expensesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    marginBottom: '25px',
  },
  expenseCard: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '15px',
  },
  expenseCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  expenseSupplier: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600' as const,
  },
  expenseRef: {
    color: '#888',
    fontSize: '14px',
  },
  expenseDate: {
    color: '#888',
    fontSize: '13px',
  },
  expenseDescription: {
    color: '#aaa',
    fontSize: '13px',
    marginBottom: '10px',
    fontStyle: 'italic' as const,
  },
  expenseAmounts: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginBottom: '10px',
  },
  expenseAmountItem: {
    background: '#222',
    padding: '4px 10px',
    borderRadius: '5px',
    fontSize: '12px',
    color: '#ccc',
  },
  expenseCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px solid #333',
  },
  expenseTotal: {
    color: '#ff9800',
    fontSize: '16px',
    fontWeight: '700' as const,
  },
  deleteExpenseBtn: {
    background: 'transparent',
    color: '#ff4444',
    border: '1px solid #ff4444',
    padding: '5px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  expensesSummary: {
    background: '#111',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #333',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    color: '#ccc',
    fontSize: '14px',
  },
  summaryTotal: {
    borderTop: '2px solid #ff9800',
    paddingTop: '15px',
    marginTop: '10px',
    color: '#ff9800',
    fontWeight: '700' as const,
    fontSize: '16px',
  },
  profitRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600' as const,
  },
  noExpensesSection: {
    maxWidth: '900px',
    margin: '30px auto 0',
    textAlign: 'center' as const,
    padding: '30px',
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '1px dashed #333',
  },
  addFirstExpenseBtn: {
    background: 'rgba(255, 152, 0, 0.2)',
    color: '#ff9800',
    border: '1px solid rgba(255, 152, 0, 0.4)',
    padding: '12px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600' as const,
  },
};
