'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { colors, layoutStyles, textStyles, buttonStyles } from '@/lib/styles';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * With custom fallback:
 * <ErrorBoundary fallback={<CustomError />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/autow/welcome';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>⚠️</span>
            </div>
            
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              An unexpected error occurred. Don't worry, your data is safe.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={styles.errorDetails}>
                <p style={styles.errorName}>{this.state.error.name}: {this.state.error.message}</p>
                {this.state.errorInfo && (
                  <pre style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            <div style={styles.buttonGroup}>
              <button onClick={this.handleRetry} style={styles.primaryButton}>
                🔄 Try Again
              </button>
              <button onClick={this.handleReload} style={styles.secondaryButton}>
                🔃 Reload Page
              </button>
              <button onClick={this.handleGoHome} style={styles.secondaryButton}>
                🏠 Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    ...layoutStyles.centeredContainer,
    background: colors.bgDark,
  },
  errorBox: {
    ...layoutStyles.narrowContentBox,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '64px',
  },
  title: {
    ...textStyles.pageTitle,
    color: colors.warning,
    marginBottom: '12px',
  },
  message: {
    ...textStyles.bodyText,
    color: colors.textSecondary,
    marginBottom: '24px',
  },
  errorDetails: {
    background: 'rgba(244, 67, 54, 0.1)',
    border: `1px solid ${colors.error}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  errorName: {
    color: colors.error,
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    wordBreak: 'break-word',
  },
  stackTrace: {
    color: colors.textSecondary,
    fontSize: '11px',
    margin: 0,
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    ...buttonStyles.primary,
  },
  secondaryButton: {
    ...buttonStyles.secondary,
  },
};

export default ErrorBoundary;
