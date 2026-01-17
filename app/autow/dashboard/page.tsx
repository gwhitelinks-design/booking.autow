'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Booking } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, total: 0 });
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
      return;
    }
    fetchBookings();
  }, [router]);

  // Click-outside handler for action menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openActionMenu !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('.actions-container')) {
          setOpenActionMenu(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenu]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/autow/booking/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('autow_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);

        const today = new Date().toISOString().split('T')[0];
        const todayList = data.bookings.filter((b: Booking) =>
          b.booking_date.split('T')[0] === today
        );
        const upcomingList = data.bookings.filter((b: Booking) =>
          b.booking_date.split('T')[0] !== today
        ).slice(0, 20);

        setTodayBookings(todayList);
        setUpcomingBookings(upcomingList);

        setStats({
          today: todayList.length,
          pending: data.bookings.filter((b: Booking) => b.status === 'confirmed').length,
          completed: data.bookings.filter((b: Booking) => b.status === 'completed').length,
          total: data.bookings.length
        });

        setLoading(false);
      } else if (response.status === 401) {
        // Only redirect to login on authentication errors
        router.push('/autow');
      } else {
        // For other errors (like database errors), just show empty state
        console.error('Failed to fetch bookings:', response.status);
        alert('Error loading bookings. Please check database connection.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      alert('Error loading bookings: ' + err);
      setLoading(false);
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this booking as completed?')) return;

    try {
      const response = await fetch('/api/autow/booking/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('autow_token')}`
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('WARNING: PERMANENTLY DELETE this booking? This cannot be undone!')) return;

    try {
      const response = await fetch('/api/autow/booking/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('autow_token')}`
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Failed to delete booking');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <span style={styles.statusCompleted}>✓ COMPLETED</span>;
    }
    if (status === 'cancelled') {
      return <span style={styles.statusCancelled}>✗ CANCELLED</span>;
    }
    return <span style={styles.statusPending}>⏱ PENDING</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderBookingCard = (booking: Booking, isToday = false) => (
    <div
      key={booking.id}
      style={{
        ...styles.bookingCard,
        ...(isToday ? styles.bookingCardToday : {}),
        ...(booking.status === 'completed' ? styles.bookingCardCompleted : {}),
        ...(booking.status === 'cancelled' ? styles.bookingCardCancelled : {})
      }}
    >
      <div style={styles.bookingHeader}>
        <span>{booking.vehicle_reg} - {booking.vehicle_make} {booking.vehicle_model}</span>
        {getStatusBadge(booking.status)}
      </div>

      <div style={styles.bookingDetails}>
        <div style={styles.detailRow}>
          <strong>🔧 Service:</strong> {booking.service_type}
        </div>
        {!isToday && (
          <div style={styles.detailRow}>
            <strong>📅 Date:</strong> {formatDate(booking.booking_date)}
          </div>
        )}
        <div style={styles.detailRow}>
          <strong>⏰ Time:</strong> {booking.booking_time.substring(0, 5)}
        </div>
        <div style={styles.detailRow}>
          <strong>👤 Customer:</strong> {booking.customer_name}
        </div>
        <div style={styles.detailRow}>
          <strong>📞 Phone:</strong> <a href={`tel:${booking.customer_phone}`} style={styles.link}>{booking.customer_phone}</a>
        </div>
        {booking.customer_email && (
          <div style={styles.detailRow}>
            <strong>📧 Email:</strong> <a href={`mailto:${booking.customer_email}`} style={styles.link}>{booking.customer_email}</a>
          </div>
        )}
        <div style={styles.detailRow}>
          <strong>📍 Location:</strong> {booking.location_address}, {booking.location_postcode}
        </div>
        {booking.booked_by && (
          <div style={styles.detailRow}>
            <strong>👷 Booked by:</strong> {booking.booked_by}
          </div>
        )}
        <div style={styles.detailRow}>
          <strong>🛠 Issue:</strong> {booking.issue_description}
        </div>
        {booking.notes && (
          <div style={styles.detailRow}>
            <strong>📝 Notes:</strong> {booking.notes}
          </div>
        )}
      </div>

      <div style={styles.actionsContainer} className="actions-container">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenActionMenu(openActionMenu === booking.id ? null : booking.id);
          }}
          style={styles.actionsButton}
        >
          ⋮
        </button>
        {openActionMenu === booking.id && (
          <div style={styles.actionsDropdown}>
            <button
              onClick={() => {
                router.push(`/autow/estimates/create?booking_id=${booking.id}`);
                setOpenActionMenu(null);
              }}
              style={styles.actionMenuItem}
            >
              📋 Create Estimate
            </button>
            <button
              onClick={() => {
                router.push(`/autow/invoices/create?booking_id=${booking.id}`);
                setOpenActionMenu(null);
              }}
              style={styles.actionMenuItem}
            >
              🧾 Create Invoice
            </button>
            <div style={styles.menuDivider} />
            <button
              onClick={() => {
                router.push(`/autow/edit?id=${booking.id}`);
                setOpenActionMenu(null);
              }}
              style={styles.actionMenuItem}
            >
              ✏️ Edit
            </button>
            {booking.status === 'confirmed' && (
              <button
                onClick={() => {
                  handleComplete(booking.id);
                  setOpenActionMenu(null);
                }}
                style={styles.actionMenuItem}
              >
                ✅ Mark Complete
              </button>
            )}
            <div style={styles.menuDivider} />
            <button
              onClick={() => {
                handleDelete(booking.id);
                setOpenActionMenu(null);
              }}
              style={styles.actionMenuItemDanger}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#30ff37', fontSize: '24px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header} className="dashboard-header">
        <div style={styles.headerLeft} className="header-left">
          <img src="https://autow-services.co.uk/logo.png" alt="AUTOW" style={styles.logo} className="dashboard-logo" />
          <div style={styles.headerText}>
            <h1 style={styles.title} className="dashboard-title">Bookings Dashboard</h1>
            <p style={styles.subtitle} className="dashboard-subtitle">Manage your appointments</p>
          </div>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => router.push('/autow/welcome')} style={styles.backBtn}>
            ← Menu
          </button>
          <button onClick={() => router.push('/autow/jotter')} style={styles.jotterBtn}>
            ✍️ Jotter
          </button>
          <button onClick={() => router.push('/autow/notes')} style={styles.notesBtn}>
            📝 Notes
          </button>
          <button onClick={() => router.push('/autow/assessments')} style={styles.assessmentsBtn}>
            Assessments
          </button>
          <button onClick={() => router.push('/autow/booking')} style={styles.newBookingBtn}>
            + New Booking
          </button>
        </div>
      </div>

      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.today}</div>
          <div style={styles.statLabel}>📅 Today's Jobs</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.pending}</div>
          <div style={styles.statLabel}>⏱ Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.completed}</div>
          <div style={styles.statLabel}>✓ Completed</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total}</div>
          <div style={styles.statLabel}>📊 Total Upcoming</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 Today's Bookings</h2>
        {todayBookings.length ? (
          todayBookings.map(b => renderBookingCard(b, true))
        ) : (
          <div style={styles.emptyState}>No bookings scheduled for today</div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📆 Upcoming Bookings</h2>
        {upcomingBookings.length ? (
          upcomingBookings.map(b => renderBookingCard(b))
        ) : (
          <div style={styles.emptyState}>No upcoming bookings</div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-header {
            padding: 20px 10px !important;
          }

          .header-left {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .dashboard-logo {
            width: 120px !important;
          }

          .dashboard-title {
            font-size: 19.6px !important;
          }

          .dashboard-subtitle {
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
    background: '#000',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    padding: '30px',
    borderRadius: '24px',
    marginBottom: '30px',
    boxShadow: '0 25px 50px -12px rgba(48, 255, 55, 0.25), 0 0 0 1px rgba(48, 255, 55, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    width: '180px',
    height: 'auto',
    filter: 'drop-shadow(0 4px 12px rgba(48, 255, 55, 0.3))',
  },
  headerText: {},
  title: {
    fontSize: '28px',
    color: '#30ff37',
    marginBottom: '5px',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '0',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  backBtn: {
    background: 'rgba(48, 255, 55, 0.1)',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    transition: 'all 0.3s',
  },
  jotterBtn: {
    background: 'rgba(156, 39, 176, 0.1)',
    border: '2px solid rgba(156, 39, 176, 0.4)',
    color: '#ce93d8',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    transition: 'all 0.3s',
  },
  notesBtn: {
    background: 'rgba(156, 39, 176, 0.15)',
    border: '2px solid rgba(156, 39, 176, 0.5)',
    color: '#e1bee7',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    transition: 'all 0.3s',
  },
  assessmentsBtn: {
    background: 'rgba(124, 58, 237, 0.1)',
    border: '2px solid rgba(124, 58, 237, 0.4)',
    color: '#a78bfa',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    transition: 'all 0.3s',
  },
  newBookingBtn: {
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    border: 'none',
    color: '#000',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    transition: 'all 0.3s',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    padding: '25px',
    borderRadius: '20px',
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.1)',
    transition: 'transform 0.3s',
  },
  statNumber: {
    fontSize: '42px',
    fontWeight: 'bold' as const,
    color: '#30ff37',
    marginBottom: '8px',
  },
  statLabel: {
    color: '#888',
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#30ff37',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 20px 0',
  },
  bookingCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.1)',
    transition: 'all 0.3s',
    borderLeft: '6px solid #30ff37',
  },
  bookingCardToday: {
    background: 'linear-gradient(145deg, rgba(48, 255, 55, 0.05), #1a1a1a)',
  },
  bookingCardCompleted: {
    borderLeftColor: '#4caf50',
    opacity: 0.8,
  },
  bookingCardCancelled: {
    borderLeftColor: '#f44336',
    opacity: 0.7,
  },
  bookingHeader: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    marginBottom: '12px',
    color: '#30ff37',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  statusPending: {
    background: '#ff9800',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  statusCompleted: {
    background: '#4caf50',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  statusCancelled: {
    background: '#f44336',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  bookingDetails: {
    margin: '12px 0',
    lineHeight: 1.8,
    color: '#aaa',
  },
  detailRow: {
    margin: '6px 0',
  },
  link: {
    color: '#30ff37',
    textDecoration: 'none',
  },
  actionsContainer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid rgba(48, 255, 55, 0.1)',
    position: 'relative' as const,
    display: 'flex',
    justifyContent: 'flex-end',
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
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '8px',
    padding: '8px 0',
    minWidth: '180px',
    zIndex: 100,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
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
    color: '#888',
    fontSize: '18px',
  },
};
