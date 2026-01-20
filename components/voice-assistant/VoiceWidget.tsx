'use client';

import React, { useEffect, useCallback } from 'react';
import { useVoice } from './VoiceProvider';
import { VoiceMicButton } from './VoiceMicButton';
import { VoiceChat } from './VoiceChat';

export function VoiceWidget() {
  const {
    status,
    messages,
    isExpanded,
    isMuted,
    error,
    toggleExpanded,
    toggleMute,
    startListening,
    stopListening,
    sendMessage,
    clearMessages,
    clearError,
  } = useVoice();

  // Handle keyboard shortcut (Ctrl+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (status === 'listening') {
          stopListening();
        } else if (status === 'idle') {
          if (!isExpanded) {
            toggleExpanded();
          }
          startListening();
        }
      }

      // Escape to close
      if (e.code === 'Escape' && isExpanded) {
        toggleExpanded();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isExpanded, startListening, stopListening, toggleExpanded]);

  const handleMicClick = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'idle') {
      startListening();
    }
  }, [status, startListening, stopListening]);

  const handleWidgetClick = useCallback(() => {
    if (!isExpanded) {
      toggleExpanded();
    }
  }, [isExpanded, toggleExpanded]);

  return (
    <>
      {/* Floating widget container */}
      <div
        style={{
          ...styles.container,
          ...(isExpanded ? styles.containerExpanded : {}),
        }}
      >
        {/* Expanded panel */}
        {isExpanded && (
          <div style={styles.panel}>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={styles.statusIndicator}>
                  <span
                    style={{
                      ...styles.statusDot,
                      backgroundColor:
                        status === 'listening'
                          ? '#30ff37'
                          : status === 'processing'
                          ? '#ffc107'
                          : status === 'speaking'
                          ? '#00bcd4'
                          : status === 'error'
                          ? '#f44336'
                          : '#666',
                    }}
                  />
                  <span style={styles.statusText}>
                    {status === 'listening'
                      ? 'Listening...'
                      : status === 'processing'
                      ? 'Thinking...'
                      : status === 'speaking'
                      ? 'Speaking...'
                      : status === 'error'
                      ? 'Error'
                      : 'Ready'}
                  </span>
                </div>
              </div>

              <div style={styles.headerActions}>
                {/* Mute button */}
                <button
                  onClick={toggleMute}
                  style={{
                    ...styles.headerButton,
                    color: isMuted ? '#f44336' : '#888',
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>

                {/* Clear messages */}
                <button
                  onClick={clearMessages}
                  style={styles.headerButton}
                  title="Clear messages"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>

                {/* Close button */}
                <button
                  onClick={toggleExpanded}
                  style={styles.headerButton}
                  title="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={styles.errorBanner}>
                <span>{error}</span>
                <button onClick={clearError} style={styles.errorClose}>×</button>
              </div>
            )}

            {/* Chat area */}
            <div style={styles.chatArea}>
              <VoiceChat
                messages={messages}
                onSendMessage={sendMessage}
                isProcessing={status === 'processing'}
              />
            </div>

            {/* Mic button at bottom */}
            <div style={styles.micContainer}>
              <VoiceMicButton
                status={status}
                onClick={handleMicClick}
                size="medium"
              />
              <span style={styles.shortcutHint}>Ctrl+Space</span>
            </div>
          </div>
        )}

        {/* Collapsed floating button */}
        {!isExpanded && (
          <div style={styles.floatingButton} onClick={handleWidgetClick}>
            <VoiceMicButton
              status={status}
              onClick={handleMicClick}
              size="medium"
            />
          </div>
        )}
      </div>

      {/* Backdrop when expanded */}
      {isExpanded && <div style={styles.backdrop} onClick={toggleExpanded} />}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  containerExpanded: {
    bottom: '0',
    right: '0',
  },
  floatingButton: {
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  panel: {
    width: '380px',
    maxWidth: '100vw',
    height: '600px',
    maxHeight: '90vh',
    backgroundColor: '#0a0a0a',
    borderRadius: '20px 20px 0 0',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderBottom: 'none',
    boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(48, 255, 55, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid rgba(48, 255, 55, 0.1)',
    backgroundColor: '#0d0d0d',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '14px',
    color: '#888',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  headerButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#888',
    transition: 'all 0.2s',
  },
  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderBottom: '1px solid rgba(244, 67, 54, 0.2)',
    color: '#f44336',
    fontSize: '13px',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#f44336',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
  },
  chatArea: {
    flex: 1,
    overflow: 'hidden',
  },
  micContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    borderTop: '1px solid rgba(48, 255, 55, 0.1)',
    backgroundColor: '#0d0d0d',
  },
  shortcutHint: {
    fontSize: '11px',
    color: '#555',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },
};
