'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * AutowErrorBoundary
 * 
 * Client-side wrapper for the ErrorBoundary to use in layouts.
 * Logs errors to console and could be extended to send to error tracking service.
 */
export function AutowErrorBoundary({ children }: { children: ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error details
    console.error('[AUTOW Error]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
    
    // TODO: Send to error tracking service (e.g., Sentry)
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

export default AutowErrorBoundary;
