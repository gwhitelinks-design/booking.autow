'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVoice } from '@/components/voice-assistant';
import { FormField } from '@/lib/voice/types';

// Define form fields for voice assistant
const BOOKING_FIELDS: FormField[] = [
  { name: 'booked_by', label: 'Booked By', type: 'text', required: true },
  { name: 'service_type', label: 'Service Type', type: 'select', required: true, options: ['Mobile Mechanic', 'Garage Service', 'Vehicle Recovery', 'ECU Remapping', 'Service'] },
  { name: 'booking_date', label: 'Booking Date', type: 'date', required: true },
  { name: 'booking_time', label: 'Booking Time', type: 'time', required: true },
  { name: 'customer_name', label: 'Customer Name', type: 'text', required: true },
  { name: 'customer_phone', label: 'Phone Number', type: 'tel', required: true },
  { name: 'customer_email', label: 'Email Address', type: 'email', required: false },
  { name: 'vehicle_reg', label: 'Vehicle Registration', type: 'text', required: true },
  { name: 'vehicle_make', label: 'Vehicle Make', type: 'text', required: true },
  { name: 'vehicle_model', label: 'Vehicle Model', type: 'text', required: true },
  { name: 'location_address', label: 'Location/Address', type: 'textarea', required: true },
  { name: 'location_postcode', label: 'Postcode', type: 'text', required: true },
  { name: 'issue_description', label: 'Issue Description', type: 'textarea', required: true },
  { name: 'notes', label: 'Special Notes', type: 'textarea', required: false },
];

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookedBy, setBookedBy] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Client lookup state
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const searchParams = useSearchParams();
  const fromJotter = searchParams.get('from_jotter') === 'true';
  const fromNote = searchParams.get('from_note') === 'true';
  const noteId = searchParams.get('note_id');
  
  const [formData, setFormData] = useState({
    service_type: 'Mobile Mechanic',
    booking_date: '',
    booking_time: '',
    customer_name: searchParams.get('customer_name') || '',
    customer_phone: searchParams.get('phone') || '',
    customer_email: '',
    vehicle_reg: searchParams.get('registration') || '',
    vehicle_make: searchParams.get('vehicle_make') || '',
    vehicle_model: searchParams.get('vehicle_model') || '',
    location_address: '',
    location_postcode: '',
    issue_description: searchParams.get('issue') || '',
    notes: searchParams.get('notes') || '',
  });

  // Parse vehicle from jotter (e.g., "Ford Focus")
  useEffect(() => {
    const vehicle = searchParams.get('vehicle');
    const year = searchParams.get('year');
    if (vehicle) {
      const parts = vehicle.split(' ');
      if (parts.length >= 2) {
        setFormData(prev => ({
          ...prev,
          vehicle_make: parts[0],
          vehicle_model: parts.slice(1).join(' '),
        }));
      } else if (parts.length === 1) {
        setFormData(prev => ({ ...prev, vehicle_make: parts[0] }));
      }
    }
    if (year) {
      setFormData(prev => ({ ...prev, notes: prev.notes + (prev.notes ? ' ' : '') + 'Year: ' + year }));
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    } else {
      setLoading(false);
      const username = localStorage.getItem('autow_username') || 'Staff';
      setBookedBy(username);
    }
  }, [router]);

  // Voice assistant integration
  const { registerPage, unregisterPage, updateFormState, onFieldFill } = useVoice();

  // Register page with voice context
  useEffect(() => {
    registerPage({
      page: '/autow/booking',
      title: 'New Booking',
      description: 'Create a new customer appointment for automotive services',
      fields: BOOKING_FIELDS,
      formState: { ...formData, booked_by: bookedBy },
      availableActions: ['Fill fields', 'Create booking', 'Cancel'],
    });

    return () => unregisterPage();
  }, [registerPage, unregisterPage]);

  // Update voice context when form state changes
  useEffect(() => {
    updateFormState({ ...formData, booked_by: bookedBy });
  }, [formData, bookedBy, updateFormState]);

  // Handle voice field fill
  const handleVoiceFieldFill = useCallback((fieldName: string, value: string) => {
    if (fieldName === 'booked_by') {
      setBookedBy(value);
    } else if (fieldName in formData) {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  }, [formData]);

  // Subscribe to voice field fill events
  useEffect(() => {
    return onFieldFill(handleVoiceFieldFill);
  }, [onFieldFill, handleVoiceFieldFill]);

  // Listen for voice submit form event
  useEffect(() => {
    const handleVoiceSubmit = () => {
      // Only submit if form is valid
      const form = document.querySelector('form');
      if (form && form.checkValidity() && !submitting) {
        form.requestSubmit();
      }
    };

    window.addEventListener('voice-submit-form', handleVoiceSubmit);
    return () => window.removeEventListener('voice-submit-form', handleVoiceSubmit);
  }, [submitting]);

  // Fetch clients for lookup
  const fetchClients = useCallback(async (search: string) => {
    setLoadingClients(true);
    try {
      const token = localStorage.getItem('autow_token');
      const res = await fetch(`/api/autow/client/list?search=${encodeURIComponent(search)}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // Search clients when modal opens or search changes
  useEffect(() => {
    if (showClientModal) {
      const debounce = setTimeout(() => {
        fetchClients(clientSearch);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [showClientModal, clientSearch, fetchClients]);

  // Select a client and fill form
  const selectClient = (client: any) => {
    setFormData(prev => ({
      ...prev,
      customer_name: client.name || '',
      customer_phone: client.phone || client.mobile || '',
      customer_email: client.email || '',
      vehicle_reg: client.vehicle_reg || '',
      vehicle_make: client.vehicle_make || '',
      vehicle_model: client.vehicle_model || '',
      location_address: client.address || '',
      notes: client.notes ? (prev.notes ? prev.notes + '\n' + client.notes : client.notes) : prev.notes,
    }));
    setShowClientModal(false);
    setClientSearch('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, ''); // Remove non-digits

    if (value.length >= 2) {
      value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }

    setFormData(prev => ({
      ...prev,
      booking_time: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/autow/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('autow_token')}`
        },
        body: JSON.stringify({
          ...formData,
          booked_by: bookedBy,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('✓ Booking confirmed!');
        setTimeout(() => {
          router.push('/autow/dashboard');
        }, 1500);
      } else {
        alert(data.error || 'Failed to create booking');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#30ff37', fontSize: '24px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer} className="form-container">
        <div style={styles.header}>
          <img
            src="https://autow-services.co.uk/logo.png"
            alt="AUTOW"
            style={styles.logo}
          />
          <h1 style={styles.title}>New Booking</h1>
          <p style={styles.subtitle}>Create a new customer appointment</p>
        </div>

        {(fromJotter || fromNote) && (
          <div style={styles.jotterBanner}>
            Data pre-filled from {fromNote ? 'Jotter Note' : 'Smart Jotter'}
          </div>
        )}

        {successMessage && (
          <div style={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Booked By *</label>
            <input
              type="text"
              name="booked_by"
              value={bookedBy}
              onChange={(e) => setBookedBy(e.target.value)}
              required
              placeholder="Enter your name"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Service Type *</label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="Mobile Mechanic">Mobile Mechanic</option>
              <option value="Garage Service">Garage Service</option>
              <option value="Vehicle Recovery">Vehicle Recovery</option>
              <option value="ECU Remapping">ECU Remapping</option>
              <option value="Service">Service</option>
            </select>
          </div>

          <div style={styles.formRow} className="form-row">
            <div style={styles.formGroup}>
              <label style={styles.label}>Booking Date *</label>
              <input
                type="date"
                name="booking_date"
                value={formData.booking_date}
                onChange={handleChange}
                required
                style={styles.input}
                className="date-input"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Booking Time (24hr format) *</label>
              <input
                type="text"
                name="booking_time"
                value={formData.booking_time}
                onChange={handleTimeInput}
                required
                placeholder="14:30"
                maxLength={5}
                inputMode="numeric"
                style={styles.input}
                className="time-input"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Customer Name *</label>
            <div style={styles.inputWithButton}>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                placeholder="John Smith"
                style={{ ...styles.input, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowClientModal(true)}
                style={styles.clientBtn}
              >
                👤 Clients
              </button>
            </div>
          </div>

          {/* Client Lookup Modal */}
          {showClientModal && (
            <div style={styles.modalOverlay} onClick={() => setShowClientModal(false)}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Select Client</h3>
                  <button
                    onClick={() => setShowClientModal(false)}
                    style={styles.modalClose}
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Search by name, phone, or reg..."
                  style={styles.searchInput}
                  autoFocus
                />
                <div style={styles.clientList}>
                  {loadingClients ? (
                    <div style={styles.clientLoading}>Loading...</div>
                  ) : clients.length === 0 ? (
                    <div style={styles.clientEmpty}>No clients found</div>
                  ) : (
                    clients.map(client => (
                      <div
                        key={client.id}
                        style={styles.clientItem}
                        onClick={() => selectClient(client)}
                      >
                        <div style={styles.clientName}>{client.name}</div>
                        <div style={styles.clientDetails}>
                          {client.phone && <span>{client.phone}</span>}
                          {client.vehicle_reg && <span> • {client.vehicle_reg}</span>}
                          {client.vehicle_make && <span> • {client.vehicle_make} {client.vehicle_model}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number *</label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              required
              placeholder="07123456789"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleChange}
              placeholder="customer@email.com"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Vehicle Registration *</label>
            <input
              type="text"
              name="vehicle_reg"
              value={formData.vehicle_reg}
              onChange={handleChange}
              required
              placeholder="AB12 CDE"
              style={{ ...styles.input, textTransform: 'uppercase' }}
            />
          </div>

          <div style={styles.formRow} className="form-row">
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle Make *</label>
              <input
                type="text"
                name="vehicle_make"
                value={formData.vehicle_make}
                onChange={handleChange}
                required
                placeholder="Ford"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle Model *</label>
              <input
                type="text"
                name="vehicle_model"
                value={formData.vehicle_model}
                onChange={handleChange}
                required
                placeholder="Focus"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location/Address *</label>
            <textarea
              name="location_address"
              value={formData.location_address}
              onChange={handleChange}
              required
              rows={2}
              placeholder="Street address"
              style={styles.textarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Postcode *</label>
            <input
              type="text"
              name="location_postcode"
              value={formData.location_postcode}
              onChange={handleChange}
              required
              placeholder="SW1A 1AA"
              style={{ ...styles.input, textTransform: 'uppercase' }}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Issue Description *</label>
            <textarea
              name="issue_description"
              value={formData.issue_description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe the issue"
              style={styles.textarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Special Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Additional notes"
              style={styles.textarea}
            />
          </div>

          <div style={styles.buttons}>
            <button
              type="submit"
              style={{
                ...styles.btnSave,
                ...(submitting ? styles.btnDisabled : {})
              }}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : '💾 Create Booking'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/autow/welcome')}
              style={styles.btnCancel}
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .form-container {
            padding: 30px 10px !important;
          }

          .form-row {
            grid-template-columns: 1fr !important;
          }

          .date-input,
          .time-input {
            font-size: 16px !important;
            padding: 12px !important;
            max-width: 100% !important;
            touch-action: manipulation !important;
          }

          /* Simple time text input */
          .time-input {
            text-align: center !important;
            letter-spacing: 2px !important;
            font-weight: 600 !important;
            font-family: monospace !important;
          }

          /* Date picker styling */
          .date-input {
            -webkit-appearance: none;
            appearance: none;
            background: rgba(255, 255, 255, 0.05) !important;
            color: #fff !important;
          }

          .date-input::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
            opacity: 0.8;
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
    paddingTop: 'max(20px, env(safe-area-inset-top))',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(20px, env(safe-area-inset-left))',
    paddingRight: 'max(20px, env(safe-area-inset-right))',
  },
  formContainer: {
    maxWidth: '700px',
    margin: '0 auto',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  logo: {
    width: '180px',
    height: 'auto',
    margin: '0 auto 20px',
    filter: 'drop-shadow(0 4px 12px rgba(48, 255, 55, 0.3))',
    display: 'block',
  },
  title: {
    color: '#30ff37',
    fontSize: '28px',
    marginBottom: '5px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '14px',
    margin: '0',
  },
  jotterBanner: {
    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
    color: '#fff',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontWeight: '600' as const,
    boxShadow: '0 4px 16px rgba(156, 39, 176, 0.4)',
    textAlign: 'center' as const,
  },
  successMessage: {
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    color: '#000',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontWeight: '600' as const,
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.4)',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    display: 'block',
    fontWeight: '600' as const,
    marginBottom: '8px',
    color: '#30ff37',
    fontSize: '13px',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '14px',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'all 0.3s',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '14px',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#fff',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '14px',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'all 0.3s',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  buttons: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  btnSave: {
    flex: 1,
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    letterSpacing: '0.5px',
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    color: '#000',
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.4)',
    minHeight: '56px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  btnCancel: {
    flex: 1,
    padding: '16px',
    border: '2px solid rgba(244, 67, 54, 0.2)',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    background: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    transition: 'all 0.3s',
    minHeight: '56px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  inputWithButton: {
    display: 'flex',
    gap: '10px',
  },
  clientBtn: {
    padding: '14px 16px',
    border: '2px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.3s',
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
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid rgba(48, 255, 55, 0.2)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#30ff37',
    margin: 0,
    fontSize: '18px',
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px',
  },
  searchInput: {
    margin: '15px 20px',
    padding: '14px',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
  },
  clientList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '0 10px 10px',
  },
  clientLoading: {
    color: '#888',
    textAlign: 'center' as const,
    padding: '30px',
  },
  clientEmpty: {
    color: '#888',
    textAlign: 'center' as const,
    padding: '30px',
  },
  clientItem: {
    padding: '15px',
    margin: '5px 10px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid transparent',
  },
  clientName: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: '15px',
    marginBottom: '4px',
  },
  clientDetails: {
    color: '#888',
    fontSize: '13px',
  },
};
