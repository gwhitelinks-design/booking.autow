'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JotterNote } from '@/lib/types';

export default function ViewNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get('id');
  const [note, setNote] = useState<JotterNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    if (noteId) {
      fetchNote();
    }
  }, [router, noteId]);

  const fetchNote = async () => {
    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch(`/api/autow/note/get?id=${noteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNote(data.note);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToBooking = () => {
    if (!note) return;
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
        <div style={styles.loadingText}>Loading note...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Note not found</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="mobile-container">
      <div style={styles.header} className="mobile-header">
        <div>
          <h1 style={styles.title} className="mobile-title">{note.note_number}</h1>
          <p style={styles.subtitle}>Created {new Date(note.created_at || '').toLocaleDateString('en-GB')}</p>
        </div>
        <div style={styles.headerActions} className="mobile-actions">
          <button onClick={() => router.push(`/autow/notes/edit?id=${note.id}`)} style={styles.editButton} className="mobile-btn">
            Edit
          </button>
          {note.status !== 'converted' && (
            <button onClick={convertToBooking} style={styles.convertButton} className="mobile-btn">
              Make Booking
            </button>
          )}
          <button onClick={() => router.push('/autow/notes')} style={styles.backButton} className="mobile-btn">
            Back
          </button>
        </div>
      </div>

      <div style={styles.card} className="mobile-card">
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Customer Information</h2>
          <div style={styles.grid} className="mobile-grid">
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Name</span>
              <span style={styles.value}>{note.customer_name || '-'}</span>
            </div>
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Phone</span>
              <span style={styles.value}>{note.customer_phone || '-'}</span>
            </div>
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Email</span>
              <span style={styles.value}>{note.customer_email || '-'}</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Vehicle Information</h2>
          <div style={styles.grid} className="mobile-grid">
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Registration</span>
              <span style={styles.value}>{note.vehicle_reg || '-'}</span>
            </div>
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Make</span>
              <span style={styles.value}>{note.vehicle_make || '-'}</span>
            </div>
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Model</span>
              <span style={styles.value}>{note.vehicle_model || '-'}</span>
            </div>
            <div style={styles.field} className="mobile-form-group">
              <span style={styles.label}>Year</span>
              <span style={styles.value}>{note.vehicle_year || '-'}</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Issue Details</h2>
          <div style={styles.field} className="mobile-form-group">
            <span style={styles.label}>Description</span>
            <p style={styles.textBlock}>{note.issue_description || '-'}</p>
          </div>
          <div style={styles.field} className="mobile-form-group">
            <span style={styles.label}>Notes</span>
            <p style={styles.textBlock}>{note.notes || '-'}</p>
          </div>
        </div>

        {note.raw_input && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Original Input</h2>
            <p style={styles.rawInput}>{note.raw_input}</p>
            {note.confidence_score && (
              <p style={styles.confidence}>Confidence: {Math.round(note.confidence_score * 100)}%</p>
            )}
          </div>
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
    fontSize: '32px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '14px',
    margin: '0',
  },
  editButton: {
    padding: '12px 24px',
    background: 'rgba(156, 39, 176, 0.2)',
    color: '#ce93d8',
    border: '1px solid rgba(156, 39, 176, 0.4)',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  convertButton: {
    padding: '12px 24px',
    background: '#30ff37',
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
  card: {
    background: '#1a1a1a',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '16px',
    padding: '30px',
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#ce93d8',
    fontSize: '18px',
    margin: '0 0 20px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    color: '#aaa',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
  },
  value: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600' as const,
  },
  textBlock: {
    color: '#fff',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
  },
  rawInput: {
    color: '#aaa',
    fontSize: '14px',
    fontStyle: 'italic' as const,
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '16px',
    borderRadius: '8px',
    lineHeight: '1.6',
  },
  confidence: {
    color: '#30ff37',
    fontSize: '14px',
    marginTop: '12px',
  },
  loadingText: {
    color: '#ce93d8',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
