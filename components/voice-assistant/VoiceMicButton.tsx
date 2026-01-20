'use client';

import React from 'react';
import { VoiceStatus } from '@/lib/voice/types';

interface VoiceMicButtonProps {
  status: VoiceStatus;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function VoiceMicButton({ status, onClick, size = 'medium' }: VoiceMicButtonProps) {
  const sizes = {
    small: { button: 40, icon: 18, orb: 36 },
    medium: { button: 56, icon: 24, orb: 50 },
    large: { button: 72, icon: 32, orb: 66 },
  };

  const { button: buttonSize, icon: iconSize, orb: orbSize } = sizes[size];

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return '#30ff37';
      case 'processing':
        return '#ffc107';
      case 'speaking':
        return '#00bcd4';
      case 'error':
        return '#f44336';
      default:
        return '#30ff37';
    }
  };

  const isActive = status === 'listening' || status === 'processing' || status === 'speaking';

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.button,
        width: buttonSize,
        height: buttonSize,
        boxShadow: isActive
          ? `0 0 20px ${getStatusColor()}80, 0 0 40px ${getStatusColor()}40`
          : '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
      aria-label={status === 'listening' ? 'Stop listening' : 'Start voice input'}
    >
      {/* Animated orb background */}
      <div
        style={{
          ...styles.orb,
          width: orbSize,
          height: orbSize,
          backgroundColor: getStatusColor(),
          animation: isActive ? 'pulse 1.5s ease-in-out infinite' : 'none',
          opacity: isActive ? 1 : 0.3,
        }}
      />

      {/* Mic icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={isActive ? '#000' : '#fff'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={styles.icon}
      >
        {status === 'listening' ? (
          // Waveform icon when listening
          <>
            <line x1="4" y1="12" x2="4" y2="12" />
            <line x1="8" y1="8" x2="8" y2="16" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="16" y1="8" x2="16" y2="16" />
            <line x1="20" y1="12" x2="20" y2="12" />
          </>
        ) : status === 'processing' ? (
          // Loading dots when processing
          <>
            <circle cx="6" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="18" cy="12" r="2" fill="currentColor" />
          </>
        ) : status === 'speaking' ? (
          // Speaker icon when speaking
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          // Default mic icon
          <>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </>
        )}
      </svg>

      {/* Pulse rings for listening state */}
      {status === 'listening' && (
        <>
          <div style={{ ...styles.ring, ...styles.ring1 }} />
          <div style={{ ...styles.ring, ...styles.ring2 }} />
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    border: '2px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'visible',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  icon: {
    position: 'relative',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '2px solid #30ff37',
    animation: 'ripple 1.5s ease-out infinite',
  },
  ring1: {
    animationDelay: '0s',
  },
  ring2: {
    animationDelay: '0.75s',
  },
};
