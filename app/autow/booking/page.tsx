'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookedBy, setBookedBy] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    service_type: 'Mobile Mechanic',
    booking_date: '',
    booking_time: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    vehicle_reg: '',
    vehicle_make: '',
    vehicle_model: '',
    location_address: '',
    location_postcode: '',
    issue_description: '',
    notes: '',
  });

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
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              placeholder="John Smith"
              style={styles.input}
            />
          </div>

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
    background: '#000',
    minHeight: '100vh',
    padding: '20px',
  },
  formContainer: {
    maxWidth: '700px',
    margin: '0 auto',
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(48, 255, 55, 0.25), 0 0 0 1px rgba(48, 255, 55, 0.1)',
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
    color: '#888',
    fontSize: '14px',
    margin: '0',
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
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
};
