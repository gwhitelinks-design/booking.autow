'use client';

import React from 'react';
import { colors, loadingStyles } from '@/lib/styles';

interface LoadingSpinnerProps {
  /** Size of the spinner (default: 40) */
  size?: number;
  /** Text to display below spinner */
  text?: string;
  /** Whether to fill full page (default: false) */
  fullPage?: boolean;
  /** Custom color override */
  color?: string;
}

/**
 * LoadingSpinner Component
 * 
 * A consistent loading indicator for use across the app.
 * 
 * Usage:
 * <LoadingSpinner />
 * <LoadingSpinner text="Loading bookings..." />
 * <LoadingSpinner fullPage />
 * <LoadingSpinner size={24} />
 */
export function LoadingSpinner({
  size = 40,
  text,
  fullPage = false,
  color = colors.primary,
}: LoadingSpinnerProps) {
  const spinner = (
    <div style={styles.spinnerContainer}>
      <div
        style={{
          ...styles.spinner,
          width: size,
          height: size,
          borderColor: `${color}20`,
          borderTopColor: color,
        }}
      />
      {text && <p style={{ ...styles.text, color }}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div style={styles.fullPage}>{spinner}</div>;
  }

  return spinner;
}

/**
 * LoadingOverlay Component
 * 
 * An overlay that covers a container while loading.
 * 
 * Usage:
 * <div style={{ position: 'relative' }}>
 *   <YourContent />
 *   {isLoading && <LoadingOverlay />}
 * </div>
 */
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div style={styles.overlay}>
      <LoadingSpinner text={text} />
    </div>
  );
}

/**
 * LoadingDots Component
 * 
 * Animated dots for inline loading states.
 * 
 * Usage:
 * <button>Saving<LoadingDots /></button>
 */
export function LoadingDots() {
  return (
    <span style={styles.dotsContainer}>
      <span style={{ ...styles.dot, animationDelay: '0ms' }}>.</span>
      <span style={{ ...styles.dot, animationDelay: '200ms' }}>.</span>
      <span style={{ ...styles.dot, animationDelay: '400ms' }}>.</span>
      <style>{`
        @keyframes loadingDotPulse {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

/**
 * SkeletonLoader Component
 * 
 * A placeholder skeleton for content that's loading.
 * 
 * Usage:
 * <SkeletonLoader width="100%" height={20} />
 * <SkeletonLoader width={200} height={40} borderRadius={20} />
 */
export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}) {
  return (
    <>
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius,
          background: `linear-gradient(90deg, ${colors.bgCardDark} 25%, rgba(255,255,255,0.1) 50%, ${colors.bgCardDark} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'skeletonShimmer 1.5s infinite',
        }}
      />
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

/**
 * PageLoading Component
 * 
 * Full page loading state with AUTOW branding.
 * Use this for initial page loads.
 * 
 * Usage:
 * if (loading) return <PageLoading />;
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div style={styles.fullPage}>
      <div style={styles.pageLoadingContainer}>
        <img
          src="https://autow-services.co.uk/logo.png"
          alt="AUTOW"
          style={styles.logo}
        />
        <LoadingSpinner size={48} />
        <p style={styles.pageLoadingText}>{text}</p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    borderRadius: '50%',
    border: '3px solid',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    ...loadingStyles.text,
    fontSize: '16px',
    margin: 0,
  },
  fullPage: {
    ...loadingStyles.fullPage,
    background: colors.bgDark,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'inherit',
    zIndex: 10,
  },
  dotsContainer: {
    display: 'inline-flex',
    marginLeft: '2px',
  },
  dot: {
    animation: 'loadingDotPulse 1s infinite',
  },
  pageLoadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    width: '120px',
    height: 'auto',
    filter: `drop-shadow(0 4px 12px ${colors.primaryGlow})`,
  },
  pageLoadingText: {
    color: colors.textSecondary,
    fontSize: '16px',
    margin: 0,
  },
};

// Add global keyframes
if (typeof document !== 'undefined') {
  const styleId = 'loading-spinner-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default LoadingSpinner;
