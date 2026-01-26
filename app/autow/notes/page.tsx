'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JotterNote } from '@/lib/types';

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<JotterNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchNotes();
  }, [router, statusFilter]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('autow_token');
      const url = statusFilter === 'all'
        ? '/api/autow/note/list'
        : `/api/autow/note/list?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' },
      active: { bg: 'rgba(48, 255, 55, 0.2)', color: '#30ff37' },
      converted: { bg: 'rgba(33, 150, 243, 0.2)', color: '#2196f3' }
    };
    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.draft;
    return (
      <span style={{ ...styles.statusBadge, background: style.bg, color: style.color }}>
        {status.toUpperCase()}
      </span>
    );
  };

  const deleteNote = async (noteId: number) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/note/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: noteId })
      });
      if (response.ok) {
        fetchNotes();
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const convertToBooking = (note: JotterNote) => {
    const params = new URLSearchParams({
      note_id: note.id?.toString() || '',
      customer_name: note.customer_name || '',
      phone: note.customer_phone || '',
      vehicle_make: note.vehicle_make || '',
      vehicle_model: note.vehicle_model || '',
      registration: note.vehicle_reg || '',
      issue: note.issue_description || '',
      from_note: 'true'
    });
    router.push(`/autow/booking?${params.toString()}`);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading notes...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="mobile-container">
      <div style={styles.header} className="mobile-header">
        <div>
          <h1 style={styles.title} className="mobile-title">Jotter Notes</h1>
          <p style={styles.subtitle}>Quick notes from Smart Jotter</p>
        </div>
        <div style={styles.headerActions} className="mobile-actions">
          <button onClick={() => router.push('/autow/jotter')} style={styles.createButton} className="mobile-btn">
            + New Note
          </button>
          <button onClick={() => router.push('/autow/dashboard')} style={styles.dashboardButton} className="mobile-btn">
            Dashboard
          </button>
          <button onClick={() => router.push('/autow/welcome')} style={styles.backButton} className="mobile-btn">
            Menu
          </button>
        </div>
      </div>

      <div style={styles.filterBar} className="mobile-actions">
        {['all', 'draft', 'active', 'converted'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              ...styles.filterButton,
              ...(statusFilter === status ? styles.filterButtonActive : {})
            }}
            className="mobile-btn"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.notesList} className="mobile-grid">
        {notes.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No notes found</p>
            <button onClick={() => router.push('/autow/jotter')} style={styles.createButton} className="mobile-btn">
              Create Your First Note
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} style={styles.noteCard} className="mobile-card">
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.noteNumber}>{note.vehicle_reg || note.note_number}</h3>
                  <p style={styles.customerName}>{note.customer_name || 'No customer'}</p>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <span className="mobile-badge" style={{ background: note.status === 'converted' ? 'rgba(33, 150, 243, 0.2)' : note.status === 'active' ? 'rgba(48, 255, 55, 0.2)' : 'rgba(255, 193, 7, 0.2)', color: note.status === 'converted' ? '#2196f3' : note.status === 'active' ? '#30ff37' : '#ffc107' }}>
                    {note.status.toUpperCase()}
                  </span>
                  <p style={styles.noteDate}>
                    {note.note_date ? new Date(note.note_date).toLocaleDateString('en-GB') : 'No date'}
                  </p>
                </div>
              </div>

              <div style={styles.cardBody}>
                {note.customer_phone && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Phone:</span>
                    <span style={styles.value}>{note.customer_phone}</span>
                  </div>
                )}
                {note.vehicle_make && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Vehicle:</span>
                    <span style={styles.value}>{note.vehicle_make} {note.vehicle_model}</span>
                  </div>
                )}
                {note.issue_description && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Issue:</span>
                    <span style={styles.value}>{note.issue_description.substring(0, 50)}...</span>
                  </div>
                )}
                {note.confidence_score && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Confidence:</span>
                    <span style={styles.value}>{Math.round(note.confidence_score * 100)}%</span>
                  </div>
                )}
              </div>

              <div style={styles.cardActions} className="mobile-actions">
                <button
                  onClick={() => router.push(`/autow/notes/view?id=${note.id}`)}
                  style={styles.actionButton}
                  className="mobile-btn"
                >
                  View
                </button>
                <button
                  onClick={() => router.push(`/autow/notes/edit?id=${note.id}`)}
                  style={styles.actionButton}
                  className="mobile-btn"
                >
                  Edit
                </button>
                {note.status !== 'converted' && (
                  <button
                    onClick={() => convertToBooking(note)}
                    style={{ ...styles.actionButton, ...styles.convertButton }}
                    className="mobile-btn"
                  >
                    Make Booking
                  </button>
                )}
                <button
                  onClick={() => deleteNote(note.id!)}
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                  className="mobile-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
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
    color: '#ce93d8',
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
    background: '#9c27b0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
  dashboardButton: {
    padding: '12px 24px',
    background: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    border: '1px solid rgba(48, 255, 55, 0.4)',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
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
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#aaa',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  filterButtonActive: {
    background: 'rgba(156, 39, 176, 0.2)',
    color: '#ce93d8',
    borderColor: '#9c27b0',
  },
  notesList: {
    display: 'grid',
    gap: '20px',
  },
  noteCard: {
    background: '#1a1a1a',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '12px',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  noteNumber: {
    color: '#ce93d8',
    fontSize: '20px',
    margin: '0 0 5px 0',
    fontWeight: '700' as const,
  },
  customerName: {
    color: '#fff',
    fontSize: '16px',
    margin: '0',
  },
  noteDate: {
    color: '#aaa',
    fontSize: '14px',
    margin: '10px 0 0 0',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700' as const,
    display: 'inline-block',
  },
  cardBody: {
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  label: {
    color: '#aaa',
    fontSize: '14px',
  },
  value: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    padding: '8px 16px',
    background: 'rgba(156, 39, 176, 0.1)',
    color: '#ce93d8',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  convertButton: {
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    borderColor: 'rgba(48, 255, 55, 0.3)',
  },
  deleteButton: {
    background: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    borderColor: 'rgba(244, 67, 54, 0.3)',
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
    color: '#ce93d8',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
