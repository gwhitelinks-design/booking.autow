'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    mobile: '',
    vehicle_reg: '',
    vehicle_make: '',
    vehicle_model: '',
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }

    fetchClients();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openActionMenu !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('.actions-dropdown-container')) {
          setOpenActionMenu(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenu]);

  const fetchClients = async (search?: string) => {
    try {
      const token = localStorage.getItem('autow_token');
      const url = search
        ? `/api/autow/client/list?search=${encodeURIComponent(search)}`
        : '/api/autow/client/list';

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchClients(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
      mobile: '',
      vehicle_reg: '',
      vehicle_make: '',
      vehicle_model: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      address: client.address || '',
      phone: client.phone || '',
      mobile: client.mobile || '',
      vehicle_reg: client.vehicle_reg || '',
      vehicle_make: client.vehicle_make || '',
      vehicle_model: client.vehicle_model || '',
      notes: client.notes || ''
    });
    setShowModal(true);
    setOpenActionMenu(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Client name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('autow_token');
      const endpoint = editingClient
        ? '/api/autow/client/update'
        : '/api/autow/client/create';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          ...(editingClient && { id: editingClient.id })
        })
      });

      if (response.ok) {
        setShowModal(false);
        fetchClients(searchQuery);
        alert(editingClient ? 'Client updated!' : 'Client created!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/client/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: clientId })
      });

      if (response.ok) {
        fetchClients(searchQuery);
        alert('Client deleted!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
    setOpenActionMenu(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading clients...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="clients-page">
      <div style={styles.header} className="page-header">
        <div>
          <h1 style={styles.title}>Clients</h1>
          <p style={styles.subtitle}>Manage your client database</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={openCreateModal}
            style={styles.createButton}
            className="header-btn"
          >
            + Add Client
          </button>
          <button
            onClick={() => router.push('/autow/welcome')}
            style={styles.backButton}
            className="header-btn"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name, email, phone, or vehicle reg..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Clients List */}
      <div style={styles.clientsList}>
        {clients.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {searchQuery ? 'No clients found matching your search' : 'No clients yet'}
            </p>
            <button onClick={openCreateModal} style={styles.createButton}>
              Add Your First Client
            </button>
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} style={styles.clientCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.clientName}>{client.name}</h3>
                  {client.vehicle_reg && (
                    <span style={styles.vehicleReg}>{client.vehicle_reg}</span>
                  )}
                </div>
                <div className="actions-dropdown-container" style={styles.actionsContainer}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === client.id ? null : client.id!);
                    }}
                    style={styles.actionsButton}
                  >
                    ⋮
                  </button>
                  {openActionMenu === client.id && (
                    <div style={styles.actionsDropdown}>
                      <button
                        onClick={() => openEditModal(client)}
                        style={styles.actionMenuItem}
                      >
                        ✏️ Edit
                      </button>
                      <div style={styles.menuDivider} />
                      <button
                        onClick={() => handleDelete(client.id!)}
                        style={styles.actionMenuItemDanger}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.cardBody}>
                {client.phone && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Phone:</span>
                    <span style={styles.value}>{client.phone}</span>
                  </div>
                )}
                {client.mobile && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Mobile:</span>
                    <span style={styles.value}>{client.mobile}</span>
                  </div>
                )}
                {client.email && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Email:</span>
                    <span style={styles.value}>{client.email}</span>
                  </div>
                )}
                {client.vehicle_make && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Vehicle:</span>
                    <span style={styles.value}>
                      {client.vehicle_make} {client.vehicle_model}
                    </span>
                  </div>
                )}
                {client.address && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Address:</span>
                    <span style={styles.value}>{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingClient ? 'Edit Client' : 'Add Client'}
              </h2>
              <button onClick={() => setShowModal(false)} style={styles.modalClose}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  placeholder="Client name"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={styles.input}
                    placeholder="Phone number"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    style={styles.input}
                    placeholder="Mobile number"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                  placeholder="Email address"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ ...styles.input, minHeight: '60px' }}
                  placeholder="Full address"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Vehicle Reg</label>
                  <input
                    type="text"
                    value={formData.vehicle_reg}
                    onChange={(e) => setFormData({ ...formData, vehicle_reg: e.target.value.toUpperCase() })}
                    style={styles.input}
                    placeholder="AB12 CDE"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Vehicle Make</label>
                  <input
                    type="text"
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., Ford"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Vehicle Model</label>
                <input
                  type="text"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., Focus"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px' }}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Saving...' : (editingClient ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .page-header > div:last-child {
            width: 100%;
          }

          .header-btn {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    minHeight: '100vh',
    padding: '20px',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  title: {
    color: '#00bcd4',
    fontSize: '36px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '16px',
    margin: '0',
  },
  createButton: {
    padding: '12px 24px',
    background: '#00bcd4',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
  backButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  searchBar: {
    marginBottom: '30px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(0, 188, 212, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  clientsList: {
    display: 'grid',
    gap: '20px',
  },
  clientCard: {
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    border: '1px solid rgba(0, 188, 212, 0.4)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  clientName: {
    color: '#00bcd4',
    fontSize: '20px',
    margin: '0 0 5px 0',
    fontWeight: '700' as const,
  },
  vehicleReg: {
    display: 'inline-block',
    background: 'rgba(0, 188, 212, 0.2)',
    color: '#00bcd4',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    gap: '10px',
    fontSize: '14px',
  },
  label: {
    color: '#aaa',
    minWidth: '70px',
  },
  value: {
    color: '#fff',
  },
  actionsContainer: {
    position: 'relative' as const,
  },
  actionsButton: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
  },
  actionsDropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '4px',
    background: '#1a1a1a',
    border: '1px solid rgba(0, 188, 212, 0.3)',
    borderRadius: '8px',
    padding: '8px 0',
    minWidth: '150px',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  actionMenuItem: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  actionMenuItemDanger: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#f44336',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  menuDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '8px 0',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyText: {
    color: '#aaa',
    fontSize: '18px',
    marginBottom: '20px',
  },
  loadingText: {
    color: '#00bcd4',
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#1a1a1a',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid rgba(0, 188, 212, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#00bcd4',
    fontSize: '24px',
    margin: '0',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
  },
  modalBody: {
    padding: '20px',
  },
  modalFooter: {
    display: 'flex',
    gap: '15px',
    padding: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  formGroup: {
    marginBottom: '15px',
    flex: 1,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  formLabel: {
    display: 'block',
    color: '#aaa',
    fontSize: '14px',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid rgba(0, 188, 212, 0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  cancelButton: {
    flex: 1,
    padding: '14px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  saveButton: {
    flex: 1,
    padding: '14px 20px',
    background: '#00bcd4',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
};
