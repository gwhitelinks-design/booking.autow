'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useVoice } from '../VoiceProvider';
import { PageContext, FormField } from '@/lib/voice/types';
import { getPageConfig } from '@/lib/voice/system-prompt';

interface UseVoicePageOptions {
  fields?: FormField[];
  formState?: Record<string, string | number | boolean>;
  availableActions?: string[];
  customTitle?: string;
  customDescription?: string;
}

/**
 * Hook for pages to register with the voice assistant
 * Call this in any page that should be voice-enabled
 */
export function useVoicePage(options: UseVoicePageOptions = {}) {
  const pathname = usePathname();
  const { registerPage, unregisterPage, updateFormState, onFieldFill } = useVoice();

  // Register page context on mount
  useEffect(() => {
    const pageConfig = getPageConfig(pathname);

    const context: PageContext = {
      page: pathname,
      title: options.customTitle || pageConfig?.title || 'AUTOW Page',
      description: options.customDescription || pageConfig?.description || '',
      fields: options.fields || [],
      formState: options.formState || {},
      availableActions: options.availableActions || pageConfig?.availableActions || [],
    };

    registerPage(context);

    return () => {
      unregisterPage();
    };
  }, [pathname, registerPage, unregisterPage, options.customTitle, options.customDescription]);

  // Update form state when it changes
  useEffect(() => {
    if (options.formState) {
      updateFormState(options.formState);
    }
  }, [options.formState, updateFormState]);

  // Subscribe to field fill events
  const useFieldFillHandler = useCallback(
    (handler: (fieldName: string, value: string) => void) => {
      useEffect(() => {
        return onFieldFill(handler);
      }, [handler]);
    },
    [onFieldFill]
  );

  return {
    useFieldFillHandler,
  };
}

/**
 * Hook for using the Web Speech API directly
 * Useful for components that need speech recognition without the full voice context
 */
export function useWebSpeech() {
  const { startListening, stopListening, status, error } = useVoice();

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';
  const isIdle = status === 'idle';
  const hasError = status === 'error' || !!error;

  return {
    startListening,
    stopListening,
    isListening,
    isProcessing,
    isSpeaking,
    isIdle,
    hasError,
    error,
    status,
  };
}

// Re-export useVoice for convenience
export { useVoice } from '../VoiceProvider';
