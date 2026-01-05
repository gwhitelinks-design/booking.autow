// Types for Smart Jotter components
export interface ParsedBookingData {
  customer_name?: string;
  phone?: string;
  vehicle?: string;
  year?: string;
  registration?: string;
  issue?: string;
  notes?: string;
  confidence_score?: number;
}

export type ProcessingStep = 'input' | 'ocr' | 'parsing' | 'preview' | 'error' | 'processing';

export interface HandwritingCanvasProps {
  onDataChange: (data: CanvasData) => void;
  isDisabled?: boolean;
  isProcessing?: boolean;
  className?: string;
}

export interface ParseApiRequest {
  text: string;
}

export interface ParseApiResponse {
  success: boolean;
  data?: ParsedBookingData;
  error?: string;
  mock?: boolean;
}

export interface FieldConfidence {
  customer_name?: number;
  phone?: number;
  vehicle?: number;
  year?: number;
  registration?: number;
  issue?: number;
}

export interface OCRResponse {
  text: string;
  confidence: number;
  error?: string;
}

export interface ParseResponse {
  parsedData: ParsedBookingData;
  fieldConfidences?: FieldConfidence;
  error?: string;
}

export interface SmartJotterState {
  mode: 'canvas' | 'text';
  rawText: string;
  parsedData: ParsedBookingData | null;
  fieldConfidences?: FieldConfidence;
  isProcessing: boolean;
  error: string | null;
}

export interface CanvasData {
  image: string;
  strokes?: any[];
  width: number;
  height: number;
  isEmpty?: boolean;
}