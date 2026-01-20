'use client';

import React from 'react';
import { VoiceProvider } from './VoiceProvider';
import { VoiceWidget } from './VoiceWidget';

interface VoiceWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps children with VoiceProvider and includes the VoiceWidget
 * Use this in layouts to enable voice assistant on all child pages
 */
export function VoiceWrapper({ children }: VoiceWrapperProps) {
  return (
    <VoiceProvider>
      {children}
      <VoiceWidget />
    </VoiceProvider>
  );
}
