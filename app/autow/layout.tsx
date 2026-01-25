import type { Metadata } from 'next';
import { VoiceWrapper } from '@/components/voice-assistant/VoiceWrapper';
import { AutowErrorBoundary } from '@/components/common/AutowErrorBoundary';

export const metadata: Metadata = {
  title: 'AUTOW Booking System',
  description: 'Staff booking management system for AUTOW Services',
};

export default function AutowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AutowErrorBoundary>
      <VoiceWrapper>{children}</VoiceWrapper>
    </AutowErrorBoundary>
  );
}
