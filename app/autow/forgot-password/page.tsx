'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/autow/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    } as React.CSSProperties,
    card: {
      backgroundColor: '#111',
      borderRadius: '10px',
      padding: '40px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center' as const,
    } as React.CSSProperties,
    logo: {
      width: '120px',
      marginBottom: '30px',
    } as React.CSSProperties,
    title: {
      color: '#fff',
      fontSize: '24px',
      marginBottom: '10px',
    } as React.CSSProperties,
    subtitle: {
      color: '#888',
      fontSize: '14px',
      marginBottom: '30px',
    } as React.CSSProperties,
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    } as React.CSSProperties,
    inputGroup: {
      textAlign: 'left' as const,
    } as React.CSSProperties,
    label: {
      display: 'block',
      color: '#888',
      fontSize: '14px',
      marginBottom: '8px',
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: '12px 15px',
      backgroundColor: '#222',
      border: '1px solid #333',
      borderRadius: '5px',
      color: '#fff',
      fontSize: '16px',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    button: {
      backgroundColor: '#30ff37',
      color: '#000',
      border: 'none',
      borderRadius: '5px',
      padding: '15px',
      fontSize: '16px',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      marginTop: '10px',
    } as React.CSSProperties,
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    } as React.CSSProperties,
    error: {
      backgroundColor: '#ff000020',
      border: '1px solid #ff0000',
      color: '#ff6666',
      padding: '12px',
      borderRadius: '5px',
      fontSize: '14px',
    } as React.CSSProperties,
    success: {
      backgroundColor: '#30ff3720',
      border: '1px solid #30ff37',
      color: '#30ff37',
      padding: '20px',
      borderRadius: '5px',
      marginBottom: '20px',
    } as React.CSSProperties,
    link: {
      color: '#30ff37',
      textDecoration: 'none',
      fontSize: '14px',
      marginTop: '20px',
      display: 'block',
    } as React.CSSProperties,
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
          <div style={styles.success}>
            <h3 style={{ margin: '0 0 10px 0' }}>Check Your Email</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              If an account exists with {email}, you will receive a password reset link shortly.
            </p>
          </div>
          <Link href="/autow" style={styles.link}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gavin@autow-services.co.uk"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link href="/autow" style={styles.link}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}
