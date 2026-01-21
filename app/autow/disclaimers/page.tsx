'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Disclaimer } from '@/lib/types';

export default function DisclaimersPage() {
  const router = useRouter();
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchDisclaimers();
  }, [router, statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.actions-container')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchDisclaimers = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const url = statusFilter
        ? `/api/autow/disclaimer/list?status=${statusFilter}`
        : '/api/autow/disclaimer/list';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disclaimers');
      }

      const data = await response.json();
      setDisclaimers(data.disclaimers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/disclaimer/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete disclaimer');
      }

      setDisclaimers(disclaimers.filter(d => d.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyShareLink = async (disclaimer: any) => {
    try {
      const shareUrl = `${window.location.origin}/share/disclaimer/${disclaimer.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(disclaimer.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading disclaimers...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => router.push('/autow/welcome')} style={styles.backButton}>
            ← Menu
          </button>
          <h1 style={styles.title}>Disclaimers</h1>
        </div>
        <button
          onClick={() => router.push('/autow/disclaimers/create')}
          style={styles.createButton}
        >
          + New Disclaimer
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Filters */}
      <div style={styles.filterBar}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="signed">Signed</option>
        </select>
      </div>

      {/* Disclaimers List */}
      {disclaimers.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No disclaimers found</p>
          <button
            onClick={() => router.push('/autow/disclaimers/create')}
            style={styles.emptyButton}
          >
            Create Your First Disclaimer
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {disclaimers.map((disclaimer: any) => (
            <div key={disclaimer.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.disclaimerNumber}>{disclaimer.disclaimer_number}</span>
                <span style={{
                  ...styles.statusBadge,
                  ...(disclaimer.status === 'signed' ? styles.statusSigned : styles.statusPending),
                }}>
                  {disclaimer.status === 'signed' ? 'Signed' : 'Pending'}
                </span>
              </div>

              <div style={styles.cardBody}>
                {/* Customer & Vehicle Info */}
                {(disclaimer.customer_name || disclaimer.vehicle_reg) && (
                  <div style={styles.infoRow}>
                    {disclaimer.customer_name && (
                      <span style={styles.infoItem}>
                        <span style={styles.infoLabel}>Customer:</span> {disclaimer.customer_name}
                      </span>
                    )}
                    {disclaimer.vehicle_reg && (
                      <span style={styles.infoItem}>
                        <span style={styles.infoLabel}>Vehicle:</span> {disclaimer.vehicle_reg}
                        {(disclaimer.vehicle_make || disclaimer.vehicle_model) && (
                          <span style={styles.vehicleDetail}>
                            {' '}({[disclaimer.vehicle_make, disclaimer.vehicle_model].filter(Boolean).join(' ')})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )}

                <p style={styles.procedure}>
                  {disclaimer.procedure_description.length > 100
                    ? disclaimer.procedure_description.substring(0, 100) + '...'
                    : disclaimer.procedure_description}
                </p>

                {disclaimer.status === 'signed' && disclaimer.customer_email && (
                  <p style={styles.customerEmail}>
                    Signed by: {disclaimer.customer_email}
                  </p>
                )}

                <div style={styles.badges}>
                  {disclaimer.include_existing_parts_disclaimer && (
                    <span style={styles.badge}>Existing Parts</span>
                  )}
                  {disclaimer.include_diagnostic_payment_disclaimer && (
                    <span style={styles.badge}>Diagnostic Payment</span>
                  )}
                </div>
              </div>

              <div style={styles.cardFooter}>
                <span style={styles.date}>
                  {formatDate(disclaimer.created_at)}
                </span>

                {/* 3-dot Actions Menu */}
                <div className="actions-container" style={styles.actionsContainer}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === disclaimer.id ? null : disclaimer.id);
                    }}
                    style={styles.actionsButton}
                  >
                    ⋮
                  </button>

                  {openActionMenu === disclaimer.id && (
                    <div style={styles.actionsDropdown}>
                      <button
                        onClick={() => {
                          window.open(`/share/disclaimer/${disclaimer.share_token}`, '_blank');
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/autow/disclaimers/edit?id=${disclaimer.id}`);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          copyShareLink(disclaimer);
                          setOpenActionMenu(null);
                        }}
                        style={styles.actionMenuItem}
                      >
                        {copiedId === disclaimer.id ? '✓ Copied!' : 'Copy Link'}
                      </button>
                      <div style={styles.menuDivider} />
                      {deleteConfirm === disclaimer.id ? (
                        <>
                          <button
                            onClick={() => {
                              handleDelete(disclaimer.id);
                              setOpenActionMenu(null);
                            }}
                            style={styles.actionMenuItemDanger}
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={styles.actionMenuItem}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(disclaimer.id)}
                          style={styles.actionMenuItemDanger}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backButton: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    color: '#30ff37',
    fontSize: '28px',
    margin: '0',
  },
  createButton: {
    padding: '12px 24px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  error: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid #ff4444',
    color: '#ff4444',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  filterBar: {
    marginBottom: '20px',
  },
  filterSelect: {
    padding: '10px 15px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyText: {
    color: '#888',
    fontSize: '18px',
    marginBottom: '20px',
  },
  emptyButton: {
    padding: '15px 30px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  disclaimerNumber: {
    color: '#30ff37',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  statusPending: {
    background: 'rgba(255, 152, 0, 0.2)',
    color: '#ff9800',
  },
  statusSigned: {
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
  },
  cardBody: {
    marginBottom: '15px',
  },
  infoRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '15px',
    marginBottom: '12px',
  },
  infoItem: {
    color: '#ccc',
    fontSize: '13px',
  },
  infoLabel: {
    color: '#888',
    marginRight: '4px',
  },
  vehicleDetail: {
    color: '#888',
  },
  procedure: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 10px 0',
  },
  customerEmail: {
    color: '#888',
    fontSize: '13px',
    margin: '0 0 10px 0',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '4px 10px',
    background: 'rgba(255, 152, 0, 0.15)',
    color: '#ff9800',
    borderRadius: '6px',
    fontSize: '11px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #333',
  },
  date: {
    color: '#666',
    fontSize: '13px',
  },
  actionsContainer: {
    position: 'relative' as const,
  },
  actionsButton: {
    padding: '8px 12px',
    background: 'transparent',
    color: '#888',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  actionsDropdown: {
    position: 'absolute' as const,
    right: 0,
    top: '100%',
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '8px',
    minWidth: '140px',
    zIndex: 100,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  actionMenuItem: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    color: '#fff',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
  },
  actionMenuItemDanger: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    color: '#ff4444',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
  },
  menuDivider: {
    height: '1px',
    background: '#444',
    margin: '4px 0',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center' as const,
    paddingTop: '100px',
  },
};
