'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JotterNote } from '@/lib/types';

export default function EditNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_reg: '',
    vehicle_year: '',
    issue_description: '',
    notes: '',
    status: 'draft'
  });

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
        const note = data.note;
        setFormData({
          customer_name: note.customer_name || '',
          customer_phone: note.customer_phone || '',
          customer_email: note.customer_email || '',
          vehicle_make: note.vehicle_make || '',
          vehicle_model: note.vehicle_model || '',
          vehicle_reg: note.vehicle_reg || '',
          vehicle_year: note.vehicle_year || '',
          issue_description: note.issue_description || '',
          notes: note.notes || '',
          status: note.status || 'draft'
        });
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/note/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: noteId, ...formData })
      });

      if (response.ok) {
        router.push(`/autow/notes/view?id=${noteId}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading note...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="mobile-container">
      <div style={styles.formContainer} className="mobile-card">
        <div style={styles.header}>
          <h1 style={styles.title} className="mobile-title">Edit Note</h1>
          <p style={styles.subtitle}>Update note details</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Quick Jot Area - Primary Focus */}
          <div style={styles.jotSection}>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Jot your notes here..."
              style={styles.jotArea}
              className="mobile-textarea"
            />
          </div>

          {/* Collapsible Details Section */}
          <details style={styles.detailsSection}>
            <summary style={styles.detailsSummary}>Structured Details (optional)</summary>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Customer Information</h2>
            <div style={styles.grid} className="mobile-grid">
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  style={styles.input}
                  className="mobile-input"
                />
              </div>
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  style={styles.input}
                  className="mobile-input"
                />
              </div>
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  style={styles.input}
                  className="mobile-input"
                />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Vehicle Information</h2>
            <div style={styles.grid} className="mobile-grid">
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Registration</label>
                <input
                  type="text"
                  name="vehicle_reg"
                  value={formData.vehicle_reg}
                  onChange={handleChange}
                  style={{ ...styles.input, textTransform: 'uppercase' }}
                  className="mobile-input"
                />
              </div>
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Make</label>
                <input
                  type="text"
                  name="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={handleChange}
                  style={styles.input}
                  className="mobile-input"
                />
              </div>
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Model</label>
                <input
                  type="text"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleChange}
                  style={styles.input}
                  className="mobile-input"
                />
              </div>
              <div style={styles.formGroup} className="mobile-form-group">
                <label style={styles.label}>Year</label>
                <input
                  type="text"
                  name="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={handleChange}
                  style={styles.input}
                  className="mobile-input"
                />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Issue Details</h2>
            <div style={styles.formGroup} className="mobile-form-group">
              <label style={styles.label}>Issue Description</label>
              <textarea
                name="issue_description"
                value={formData.issue_description}
                onChange={handleChange}
                rows={3}
                style={styles.textarea}
                className="mobile-textarea"
              />
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.formGroup} className="mobile-form-group">
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={styles.select}
                className="mobile-select"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>

          </details>

          <div style={styles.buttons} className="mobile-actions">
            <button type="submit" disabled={saving} style={styles.saveButton} className="mobile-btn">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/autow/notes/view?id=${noteId}`)}
              style={styles.cancelButton}
              className="mobile-btn"
            >
              Cancel
            </button>
          </div>
        </form>
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
  formContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    background: '#1a1a1a',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '16px',
    padding: '40px',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    color: '#ce93d8',
    fontSize: '28px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '14px',
    margin: '0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  jotSection: {
    marginBottom: '10px',
  },
  jotArea: {
    width: '100%',
    minHeight: '300px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid rgba(156, 39, 176, 0.4)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    lineHeight: '1.6',
    resize: 'vertical' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  detailsSection: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '20px',
  },
  detailsSummary: {
    color: '#ce93d8',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px 0',
    marginBottom: '20px',
  },
  section: {
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#ce93d8',
    fontSize: '16px',
    margin: '0 0 16px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    color: '#aaa',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  },
  input: {
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
  },
  textarea: {
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    resize: 'vertical' as const,
  },
  select: {
    padding: '12px',
    background: '#1a1a1a',
    border: '1px solid rgba(156, 39, 176, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
  },
  buttons: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
  },
  saveButton: {
    flex: 1,
    padding: '16px',
    background: '#9c27b0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  loadingText: {
    color: '#ce93d8',
    fontSize: '24px',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
};
