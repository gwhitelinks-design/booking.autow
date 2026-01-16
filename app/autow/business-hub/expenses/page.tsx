'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Expense {
  id: number;
  date: string;
  category: string;
  subcategory: string;
  description: string;
  supplier: string;
  amount: number;
  vat: number;
  payment_method: string;
  tax_deductible_percent: number;
  is_recurring: boolean;
  created_at: string;
  invoice_id?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  vehicle_reg: string;
  total: number;
  status: string;
}

const EXPENSE_CATEGORIES: { [key: string]: string[] } = {
  'VEHICLES - FINANCE': ['Ford Ranger HP', 'Partner Car Finance', 'Recovery Truck HP'],
  'VEHICLES - RUNNING': ['Fuel', 'MOT', 'Road Tax', 'Repairs', 'Tyres', 'Service'],
  'INSURANCE': ['Motor Traders', 'Public Liability', 'Employers', 'Tools'],
  'PREMISES': ['Bay Rental', 'Electricity', 'Internet', 'Storage'],
  'COMMUNICATIONS': ['Mobile Phone', 'Broadband'],
  'CLOTHING & PPE': ['Overalls', 'Boots', 'Gloves', 'Safety Gear'],
  'TOOLS & EQUIPMENT': ['Hand Tools', 'Power Tools', 'Diagnostics', 'Lifting'],
  'CONSUMABLES': ['Oils & Fluids', 'Cleaning', 'Fasteners', 'Tape & Adhesives'],
  'PROFESSIONAL': ['Accountant', 'Legal', 'Bank Charges', 'Software'],
  'STAFF': ['Salaries', 'Wages', 'Pensions', 'Training'],
};

const PAYMENT_METHODS = [
  'Business Card',
  'Bank Transfer',
  'Cash',
  'Direct Debit',
  'PayPal',
  'Other',
];

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [totals, setTotals] = useState({
    total: 0,
    vat: 0,
    taxDeductible: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    subcategory: '',
    description: '',
    supplier: '',
    amount: '',
    vat: '',
    payment_method: 'Business Card',
    tax_deductible_percent: 100,
    is_recurring: false,
    invoice_id: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchExpenses();
    fetchInvoices();
  }, [router, filterCategory]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/invoice/list?status=paid', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      let url = '/api/autow/expenses/list';
      if (filterCategory) {
        url += `?category=${encodeURIComponent(filterCategory)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        calculateTotals(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (expenseList: Expense[]) => {
    const total = expenseList.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
    const vat = expenseList.reduce((sum, e) => sum + parseFloat(String(e.vat || 0)), 0);
    const taxDeductible = expenseList.reduce((sum, e) => {
      const amount = parseFloat(String(e.amount));
      const percent = e.tax_deductible_percent || 100;
      return sum + (amount * percent / 100);
    }, 0);

    setTotals({ total, vat, taxDeductible });
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      subcategory: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!formData.category) {
      alert('Please select a category');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('autow_token');

      const response = await fetch('/api/autow/expenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          vat: parseFloat(formData.vat || '0'),
          invoice_id: formData.invoice_id ? parseInt(formData.invoice_id) : null,
        })
      });

      if (response.ok) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          subcategory: '',
          description: '',
          supplier: '',
          amount: '',
          vat: '',
          payment_method: 'Business Card',
          tax_deductible_percent: 100,
          is_recurring: false,
          invoice_id: '',
        });
        fetchExpenses();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/expenses/delete?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      subcategory: '',
      description: '',
      supplier: '',
      amount: '',
      vat: '',
      payment_method: 'Business Card',
      tax_deductible_percent: 100,
      is_recurring: false,
      invoice_id: '',
    });
  };

  const getInvoiceLabel = (invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice ? `${invoice.invoice_number} - ${invoice.client_name}` : '-';
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
          <h1 style={styles.title}>📊 Expenses Tracking</h1>
          <p style={styles.subtitle}>Track and categorize business expenses</p>
        </div>
        <button onClick={() => router.push('/autow/business-hub')} style={styles.backBtn}>
          ← Back to Hub
        </button>
      </div>

      {/* Summary Stats */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>£{totals.total.toFixed(2)}</div>
          <div style={styles.summaryLabel}>Total Expenses</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>£{totals.vat.toFixed(2)}</div>
          <div style={styles.summaryLabel}>Total VAT</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>£{totals.taxDeductible.toFixed(2)}</div>
          <div style={styles.summaryLabel}>Tax Deductible</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{expenses.length}</div>
          <div style={styles.summaryLabel}>Entries</div>
        </div>
      </div>

      {/* Add Expense Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>➕ Add Expense</h2>
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
              <label style={styles.label}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={styles.input}
                required
              >
                <option value="">Select category...</option>
                {Object.keys(EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subcategory</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                style={styles.input}
                disabled={!formData.category}
              >
                <option value="">Select subcategory...</option>
                {formData.category && EXPENSE_CATEGORIES[formData.category]?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.input}
                placeholder="e.g., Diesel - Ford Ranger"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                style={styles.input}
                placeholder="e.g., Shell, Screwfix"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Amount (£) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                style={styles.numberInput}
                placeholder="0.00"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>VAT (£)</label>
              <input
                type="number"
                step="0.01"
                value={formData.vat}
                onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
                style={styles.numberInput}
                placeholder="0.00"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                style={styles.input}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tax Deductible %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.tax_deductible_percent}
                onChange={(e) => setFormData({ ...formData, tax_deductible_percent: parseInt(e.target.value) || 0 })}
                style={styles.numberInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>&nbsp;</label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  style={styles.checkbox}
                />
                Recurring Expense
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Link to Invoice (Job Costing)</label>
              <select
                value={formData.invoice_id}
                onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                style={styles.invoiceSelect}
              >
                <option value="">No invoice (general expense)</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.client_name} ({inv.vehicle_reg}) £{parseFloat(String(inv.total)).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={clearForm} style={styles.clearBtn}>
              Clear Form
            </button>
            <button type="submit" style={styles.submitBtn} disabled={saving}>
              {saving ? 'Saving...' : '+ Add Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Expenses Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📋 Expenses ({expenses.length})</h2>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {Object.keys(EXPENSE_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Supplier</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>VAT</th>
                <th style={styles.th}>Tax %</th>
                <th style={styles.th}>Linked Job</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} style={styles.emptyRow}>No expenses recorded yet</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td style={styles.td}>{formatDate(expense.date)}</td>
                    <td style={styles.td}>
                      <span style={styles.categoryBadge}>{expense.category}</span>
                      {expense.is_recurring && (
                        <span style={styles.recurringBadge}>↻</span>
                      )}
                    </td>
                    <td style={styles.td}>{expense.description}</td>
                    <td style={styles.td}>{expense.supplier || '-'}</td>
                    <td style={styles.tdAmount}>£{parseFloat(String(expense.amount)).toFixed(2)}</td>
                    <td style={styles.tdVat}>£{parseFloat(String(expense.vat || 0)).toFixed(2)}</td>
                    <td style={styles.td}>{expense.tax_deductible_percent}%</td>
                    <td style={styles.td}>
                      {expense.invoice_id ? (
                        <span style={styles.linkedJobBadge}>{getInvoiceLabel(expense.invoice_id)}</span>
                      ) : (
                        <span style={styles.generalBadge}>General</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(expense.id)}
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
  section: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(48, 255, 55, 0.2)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  sectionTitle: {
    color: '#30ff37',
    fontSize: '18px',
    margin: '0',
  },
  filterSelect: {
    padding: '8px 12px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    color: '#888',
    fontSize: '11px',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 12px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  numberInput: {
    padding: '10px 12px',
    background: '#0a0a0a',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    WebkitTextFillColor: '#fff',
    colorScheme: 'dark',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ccc',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '10px 0',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#30ff37',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  clearBtn: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitBtn: {
    padding: '12px 28px',
    background: '#30ff37',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '14px',
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
  tdAmount: {
    padding: '12px 10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#30ff37',
    fontWeight: '600' as const,
  },
  tdVat: {
    padding: '12px 10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#00c8ff',
    fontWeight: '600' as const,
  },
  categoryBadge: {
    background: 'rgba(48, 255, 55, 0.15)',
    color: '#30ff37',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600' as const,
  },
  recurringBadge: {
    background: 'rgba(0, 200, 255, 0.15)',
    color: '#00c8ff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    marginLeft: '6px',
  },
  invoiceSelect: {
    padding: '10px 12px',
    background: '#0a0a0a',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  linkedJobBadge: {
    background: 'rgba(255, 165, 0, 0.15)',
    color: '#ffa500',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600' as const,
  },
  generalBadge: {
    background: 'rgba(128, 128, 128, 0.15)',
    color: '#888',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
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
