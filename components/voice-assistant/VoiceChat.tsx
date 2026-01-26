'use client';

import React, { useEffect, useRef } from 'react';
import { VoiceMessage } from '@/lib/voice/types';

interface VoiceChatProps {
  messages: VoiceMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
}

export function VoiceChat({ messages, onSendMessage, isProcessing }: VoiceChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current && inputRef.current.value.trim() && !isProcessing) {
      onSendMessage(inputRef.current.value.trim());
      inputRef.current.value = '';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      {/* Messages area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#30ff37" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <p style={styles.emptyText}>Hi, I'm EDITH</p>
            <p style={styles.emptySubtext}>
              Tap the mic or type to start.<br />
              I can help fill forms and navigate.
            </p>
            <div style={styles.quickCommands}>
              <span style={styles.quickCommandLabel}>Try:</span>
              <span style={styles.quickCommand}>"New booking"</span>
              <span style={styles.quickCommand}>"Go to invoices"</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...styles.message,
                  ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage),
                }}
              >
                <div style={styles.messageContent}>
                  {message.content}
                </div>
                <div style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div style={{ ...styles.message, ...styles.assistantMessage }}>
                <div style={styles.typingIndicator}>
                  <span style={styles.typingDot} />
                  <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                  <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          style={styles.input}
          disabled={isProcessing}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            opacity: isProcessing ? 0.5 : 1,
          }}
          disabled={isProcessing}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0a0a0a',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '20px',
  },
  emptyIcon: {
    marginBottom: '16px',
    opacity: 0.8,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#30ff37',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#aaa',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  quickCommands: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCommandLabel: {
    fontSize: '12px',
    color: '#666',
  },
  quickCommand: {
    fontSize: '12px',
    color: '#30ff37',
    backgroundColor: 'rgba(48, 255, 55, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(48, 255, 55, 0.2)',
  },
  message: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#30ff37',
    color: '#000',
    borderBottomRightRadius: '4px',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderBottomLeftRadius: '4px',
  },
  messageContent: {
    wordBreak: 'break-word',
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.6,
    marginTop: '4px',
    textAlign: 'right',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#30ff37',
    animation: 'typingBounce 1.4s ease-in-out infinite',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid rgba(48, 255, 55, 0.1)',
    backgroundColor: '#0d0d0d',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '24px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30ff37',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#000',
    transition: 'all 0.2s',
  },
};
