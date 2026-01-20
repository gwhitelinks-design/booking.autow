// ============================================
// VOICE ASSISTANT TYPES
// ============================================

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface VoiceCommand {
  type: 'FILL_FIELD' | 'NAVIGATE' | 'SUBMIT_FORM' | 'CLARIFY' | 'ADD_LINE_ITEM' | 'CONFIRM';
  field?: string;
  value?: string;
  path?: string;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'time' | 'select' | 'textarea' | 'number';
  required?: boolean;
  options?: string[];
  currentValue?: string;
}

export interface PageContext {
  page: string;
  title: string;
  description: string;
  fields: FormField[];
  formState: Record<string, string | number | boolean>;
  availableActions: string[];
}

export interface VoiceContextType {
  // State
  status: VoiceStatus;
  messages: VoiceMessage[];
  isExpanded: boolean;
  isMuted: boolean;
  error: string | null;

  // Page context
  currentPage: PageContext | null;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  sendMessage: (text: string) => Promise<void>;
  toggleExpanded: () => void;
  toggleMute: () => void;
  clearMessages: () => void;
  clearError: () => void;

  // Form context registration (called by pages)
  registerPage: (context: PageContext) => void;
  unregisterPage: () => void;
  updateFormState: (state: Record<string, string | number | boolean>) => void;

  // Field filling (exposed for form pages to listen)
  fillField: (fieldName: string, value: string) => void;
  onFieldFill: (callback: (fieldName: string, value: string) => void) => () => void;
}

export interface VoiceChatRequest {
  message: string;
  pageContext: PageContext | null;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface VoiceChatResponse {
  text: string;
  commands: VoiceCommand[];
  audioBase64?: string;
  error?: string;
}

// Quick commands that don't need AI processing
export const QUICK_COMMANDS: Record<string, VoiceCommand> = {
  // Main navigation
  'go to dashboard': { type: 'NAVIGATE', path: '/autow/dashboard' },
  'go to bookings': { type: 'NAVIGATE', path: '/autow/dashboard' },
  'show bookings': { type: 'NAVIGATE', path: '/autow/dashboard' },
  'go to menu': { type: 'NAVIGATE', path: '/autow/welcome' },
  'main menu': { type: 'NAVIGATE', path: '/autow/welcome' },
  'go home': { type: 'NAVIGATE', path: '/autow/welcome' },

  // Bookings
  'new booking': { type: 'NAVIGATE', path: '/autow/booking' },
  'create booking': { type: 'NAVIGATE', path: '/autow/booking' },
  'add booking': { type: 'NAVIGATE', path: '/autow/booking' },
  'go to booking': { type: 'NAVIGATE', path: '/autow/booking' },
  'booking page': { type: 'NAVIGATE', path: '/autow/booking' },
  'booking form': { type: 'NAVIGATE', path: '/autow/booking' },
  'make booking': { type: 'NAVIGATE', path: '/autow/booking' },

  // Estimates
  'go to estimates': { type: 'NAVIGATE', path: '/autow/estimates' },
  'show estimates': { type: 'NAVIGATE', path: '/autow/estimates' },
  'new estimate': { type: 'NAVIGATE', path: '/autow/estimates/create' },
  'create estimate': { type: 'NAVIGATE', path: '/autow/estimates/create' },
  'add estimate': { type: 'NAVIGATE', path: '/autow/estimates/create' },
  'make quote': { type: 'NAVIGATE', path: '/autow/estimates/create' },

  // Invoices
  'go to invoices': { type: 'NAVIGATE', path: '/autow/invoices' },
  'show invoices': { type: 'NAVIGATE', path: '/autow/invoices' },
  'new invoice': { type: 'NAVIGATE', path: '/autow/invoices/create' },
  'create invoice': { type: 'NAVIGATE', path: '/autow/invoices/create' },
  'add invoice': { type: 'NAVIGATE', path: '/autow/invoices/create' },

  // Jotter and Notes
  'go to jotter': { type: 'NAVIGATE', path: '/autow/jotter' },
  'smart jotter': { type: 'NAVIGATE', path: '/autow/jotter' },
  'open jotter': { type: 'NAVIGATE', path: '/autow/jotter' },
  'go to notes': { type: 'NAVIGATE', path: '/autow/notes' },
  'show notes': { type: 'NAVIGATE', path: '/autow/notes' },

  // Receipts
  'go to receipts': { type: 'NAVIGATE', path: '/autow/receipts' },
  'show receipts': { type: 'NAVIGATE', path: '/autow/receipts' },
  'upload receipt': { type: 'NAVIGATE', path: '/autow/receipts/upload' },
  'add receipt': { type: 'NAVIGATE', path: '/autow/receipts/upload' },

  // Vehicle Reports and Assessments
  'go to vehicle reports': { type: 'NAVIGATE', path: '/autow/vehicle-report' },
  'show vehicle reports': { type: 'NAVIGATE', path: '/autow/vehicle-report' },
  'go to assessments': { type: 'NAVIGATE', path: '/autow/assessments' },
  'show assessments': { type: 'NAVIGATE', path: '/autow/assessments' },

  // Business Hub
  'go to business hub': { type: 'NAVIGATE', path: '/autow/business-hub' },
  'business hub': { type: 'NAVIGATE', path: '/autow/business-hub' },
  'open business hub': { type: 'NAVIGATE', path: '/autow/business-hub' },
  'go to mileage': { type: 'NAVIGATE', path: '/autow/business-hub/mileage' },
  'track mileage': { type: 'NAVIGATE', path: '/autow/business-hub/mileage' },
  'add mileage': { type: 'NAVIGATE', path: '/autow/business-hub/mileage' },
  'go to expenses': { type: 'NAVIGATE', path: '/autow/business-hub/expenses' },
  'show expenses': { type: 'NAVIGATE', path: '/autow/business-hub/expenses' },
  'go to reports': { type: 'NAVIGATE', path: '/autow/business-hub/reports' },
  'show reports': { type: 'NAVIGATE', path: '/autow/business-hub/reports' },
  'financial reports': { type: 'NAVIGATE', path: '/autow/business-hub/reports' },
};

// Voice settings (matching EDITH) - Neutral, consistent tone
export const VOICE_SETTINGS = {
  voiceId: 'kT6e56V1Tau6nyzxdCPf',
  model: 'eleven_turbo_v2_5',
  stability: 0.95,        // Higher stability = more consistent, less variation
  similarity_boost: 0.60, // Lower similarity = more neutral delivery
  speaker_boost: false,   // Disabled for more even, calm tone
};
