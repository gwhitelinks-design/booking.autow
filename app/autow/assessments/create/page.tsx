'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.comingSoonBox}>
          <div style={styles.iconWrapper}>
            <span style={styles.icon}>🔍</span>
          </div>

          <h1 style={styles.title}>Vehicle Assessment Creator</h1>
          <div style={styles.badge}>Coming Soon</div>

          <p style={styles.description}>
            We're building a comprehensive vehicle damage assessment tool that will allow you to:
          </p>

          <ul style={styles.featureList}>
            <li style={styles.featureItem}>
              <span style={styles.checkmark}>&#10003;</span>
              Document vehicle damage with photos and annotations
            </li>
            <li style={styles.featureItem}>
              <span style={styles.checkmark}>&#10003;</span>
              Auto-calculate repair cost estimates
            </li>
            <li style={styles.featureItem}>
              <span style={styles.checkmark}>&#10003;</span>
              Compare repair costs vs vehicle value
            </li>
            <li style={styles.featureItem}>
              <span style={styles.checkmark}>&#10003;</span>
              Generate professional insurance-ready reports
            </li>
            <li style={styles.featureItem}>
              <span style={styles.checkmark}>&#10003;</span>
              Share reports with customers via secure links
            </li>
            <li style={styles.featureItem}>
              <span style={styles.checkmark}>&#10003;</span>
              Automatic write-off category recommendations
            </li>
          </ul>

          <div style={styles.processSection}>
            <h3 style={styles.processTitle}>Planned Assessment Process</h3>
            <div style={styles.processSteps}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepText}>Enter vehicle details & lookup via reg</div>
              </div>
              <div style={styles.stepArrow}>&#8594;</div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepText}>Document damage with photos</div>
              </div>
              <div style={styles.stepArrow}>&#8594;</div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepText}>Add repair cost estimates</div>
              </div>
              <div style={styles.stepArrow}>&#8594;</div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <div style={styles.stepText}>Generate & share report</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/autow/assessments')}
            style={styles.backBtn}
          >
            Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#000',
    minHeight: '100vh',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  content: {
    maxWidth: '700px',
    width: '100%',
  },
  comingSoonBox: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    borderRadius: '24px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(48, 255, 55, 0.15), 0 0 0 1px rgba(48, 255, 55, 0.1)',
  },
  iconWrapper: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '80px',
  },
  title: {
    color: '#30ff37',
    fontSize: '28px',
    margin: '0 0 15px 0',
  },
  badge: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
    color: '#fff',
    padding: '8px 24px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '25px',
  },
  description: {
    color: '#888',
    fontSize: '16px',
    marginBottom: '25px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 30px 0',
    textAlign: 'left',
  },
  featureItem: {
    padding: '10px 0',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkmark: {
    color: '#30ff37',
    fontWeight: 700,
    fontSize: '18px',
  },
  processSection: {
    background: '#0a0a0a',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '30px',
  },
  processTitle: {
    color: '#30ff37',
    fontSize: '16px',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  processSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  step: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '15px',
    minWidth: '120px',
    textAlign: 'center',
  },
  stepNumber: {
    background: '#30ff37',
    color: '#000',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    margin: '0 auto 10px',
  },
  stepText: {
    color: '#888',
    fontSize: '12px',
  },
  stepArrow: {
    color: '#30ff37',
    fontSize: '24px',
  },
  backBtn: {
    padding: '14px 32px',
    background: 'transparent',
    border: '2px solid #30ff37',
    borderRadius: '8px',
    color: '#30ff37',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '16px',
  },
  loadingText: {
    color: '#30ff37',
    fontSize: '24px',
    textAlign: 'center',
  },
};
