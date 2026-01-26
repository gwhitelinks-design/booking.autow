'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/autow/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/autow');
        }, 3000);
      } else {
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
      color: '#aaa',
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
      color: '#aaa',
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
    hint: {
      color: '#666',
      fontSize: '12px',
      marginTop: '5px',
    } as React.CSSProperties,
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
          <div style={styles.success}>
            <h3 style={{ margin: '0 0 10px 0' }}>Password Reset!</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Your password has been changed successfully.
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/latest2.png" alt="AUTOW" style={styles.logo} />
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>
          Enter your new password below.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {token && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                style={styles.input}
                required
                minLength={8}
              />
              <p style={styles.hint}>Must be at least 8 characters</p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <Link href="/autow" style={styles.link}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff' }}>Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
