'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Receipt } from '@/lib/types';

const styles = {
  container: {
    backgroundColor: '#000',
    color: '#fff',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333',
    flexWrap: 'wrap' as const,
    gap: '15px',
  } as React.CSSProperties,
  logo: {
    height: '50px',
    width: 'auto',
  } as React.CSSProperties,
  headerButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  backButton: {
    backgroundColor: 'transparent',
    color: '#30ff37',
    border: '1px solid #30ff37',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  uploadButton: {
    backgroundColor: '#30ff37',
    color: '#000',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#30ff37',
  } as React.CSSProperties,
  statsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  statCard: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '20px',
    minWidth: '150px',
    flex: 1,
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  } as React.CSSProperties,
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#30ff37',
    marginTop: '5px',
  } as React.CSSProperties,
  filterRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  filterSelect: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '12px 15px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    minWidth: '150px',
  } as React.CSSProperties,
  filterInput: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '12px 15px',
    color: '#fff',
    fontSize: '14px',
    minWidth: '200px',
  } as React.CSSProperties,
  receiptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  receiptCard: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  receiptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  } as React.CSSProperties,
  receiptNumber: {
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  categoryBadge: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold',
  } as React.CSSProperties,
  supplierName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px',
  } as React.CSSProperties,
  receiptDate: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '15px',
  } as React.CSSProperties,
  receiptAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#30ff37',
    marginBottom: '15px',
  } as React.CSSProperties,
  receiptDescription: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '15px',
    fontStyle: 'italic',
  } as React.CSSProperties,
  receiptActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #333',
  } as React.CSSProperties,
  viewButton: {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    flex: 1,
    textDecoration: 'none',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  deleteButton: {
    backgroundColor: 'transparent',
    color: '#ff4444',
    border: '1px solid #ff4444',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#666',
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: '60px',
    marginBottom: '20px',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '18px',
    marginBottom: '20px',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#888',
  } as React.CSSProperties,
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#ff4444',
  } as React.CSSProperties,
  modalText: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '25px',
  } as React.CSSProperties,
  modalButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  } as React.CSSProperties,
  modalCancel: {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  modalConfirm: {
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  fuel: { bg: 'rgba(255, 152, 0, 0.2)', text: '#ff9800' },
  parts: { bg: 'rgba(33, 150, 243, 0.2)', text: '#2196f3' },
  tools: { bg: 'rgba(156, 39, 176, 0.2)', text: '#9c27b0' },
  supplies: { bg: 'rgba(0, 188, 212, 0.2)', text: '#00bcd4' },
  misc: { bg: 'rgba(158, 158, 158, 0.2)', text: '#9e9e9e' },
};

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState({ total_count: 0, total_amount: 0, month_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; receipt: Receipt | null }>({
    show: false,
    receipt: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchReceipts();
  }, [router, monthFilter, categoryFilter, supplierSearch]);

  const fetchReceipts = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const params = new URLSearchParams();
      if (monthFilter) params.append('month', monthFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (supplierSearch) params.append('supplier', supplierSearch);

      const response = await fetch(`/api/autow/receipt/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }

      const data = await response.json();
      setReceipts(data.receipts);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.receipt) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/receipt/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteModal.receipt.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }

      setDeleteModal({ show: false, receipt: null });
      fetchReceipts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalTitle}>Delete Receipt?</div>
            <div style={styles.modalText}>
              This will permanently delete {deleteModal.receipt?.receipt_number} and remove the image from storage.
            </div>
            <div style={styles.modalButtons}>
              <button
                style={styles.modalCancel}
                onClick={() => setDeleteModal({ show: false, receipt: null })}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirm}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <Image
          src="/logo.png"
          alt="AUTOW Logo"
          width={120}
          height={50}
          style={styles.logo}
          priority
        />
        <div style={styles.headerButtons}>
          <button style={styles.backButton} onClick={() => router.push('/autow/welcome')}>
            ← Menu
          </button>
          <button style={styles.uploadButton} onClick={() => router.push('/autow/receipts/upload')}>
            + Upload Receipt
          </button>
        </div>
      </div>

      <h1 style={styles.title}>Receipts</h1>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Receipts</div>
          <div style={styles.statValue}>{stats.total_count}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Spend</div>
          <div style={styles.statValue}>{formatCurrency(Number(stats.total_amount))}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Months Tracked</div>
          <div style={styles.statValue}>{stats.month_count}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Months</option>
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {new Date(month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Categories</option>
          <option value="fuel">Fuel</option>
          <option value="parts">Parts</option>
          <option value="tools">Tools</option>
          <option value="supplies">Supplies</option>
          <option value="misc">Miscellaneous</option>
        </select>

        <input
          type="text"
          placeholder="Search supplier..."
          value={supplierSearch}
          onChange={(e) => setSupplierSearch(e.target.value)}
          style={styles.filterInput}
        />
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading receipts...</div>
      ) : receipts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🧾</div>
          <div style={styles.emptyText}>No receipts found</div>
          <button style={styles.uploadButton} onClick={() => router.push('/autow/receipts/upload')}>
            Upload Your First Receipt
          </button>
        </div>
      ) : (
        <div style={styles.receiptGrid}>
          {receipts.map((receipt) => (
            <div key={receipt.id} style={styles.receiptCard}>
              <div style={styles.receiptHeader}>
                <span style={styles.receiptNumber}>{receipt.receipt_number}</span>
                {receipt.category && (
                  <span
                    style={{
                      ...styles.categoryBadge,
                      backgroundColor: categoryColors[receipt.category]?.bg || '#333',
                      color: categoryColors[receipt.category]?.text || '#fff',
                    }}
                  >
                    {receipt.category}
                  </span>
                )}
              </div>

              <div style={styles.supplierName}>{receipt.supplier}</div>
              <div style={styles.receiptDate}>{formatDate(receipt.receipt_date)}</div>
              <div style={styles.receiptAmount}>{formatCurrency(receipt.amount)}</div>

              {receipt.description && (
                <div style={styles.receiptDescription}>{receipt.description}</div>
              )}

              <div style={styles.receiptActions}>
                {(receipt as any).supabase_file_url && (
                  <a
                    href={(receipt as any).supabase_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.viewButton}
                  >
                    View Image
                  </a>
                )}
                {receipt.gdrive_file_url && (
                  <a
                    href={receipt.gdrive_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{...styles.viewButton, backgroundColor: '#1a73e8'}}
                  >
                    Google Drive
                  </a>
                )}
                <button
                  style={styles.deleteButton}
                  onClick={() => setDeleteModal({ show: true, receipt })}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
