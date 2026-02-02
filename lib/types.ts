export interface Booking {
  id: number;
  booked_by: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg: string;
  location_address: string;
  location_postcode: string;
  issue_description: string;
  notes: string | null;
  status: 'confirmed' | 'completed' | 'cancelled';
  estimated_duration: number;
  calendar_event_id: string | null;
  created_at?: string;
  updated_at?: string;
  is_expired?: boolean;
}

export interface BookingFormData {
  booked_by: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg: string;
  location_address: string;
  location_postcode: string;
  issue_description: string;
  notes?: string;
}

export interface AvailabilityCheck {
  available: boolean;
}

// ============================================
// ESTIMATES AND INVOICES TYPES
// ============================================

export interface LineItem {
  id?: number;
  document_type: 'estimate' | 'invoice';
  document_id?: number;
  description: string;
  item_type: 'service' | 'part' | 'labor' | 'other' | 'discount';
  rate: number;
  quantity: number;
  amount: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentPhoto {
  id?: number;
  document_type: 'estimate' | 'invoice';
  document_id?: number;
  photo_url: string;
  photo_data?: string;
  caption?: string;
  sort_order: number;
  uploaded_at?: string;
}

export interface Estimate {
  id?: number;
  estimate_number: string;
  estimate_date: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';

  // Client Information
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_mobile?: string;
  client_fax?: string;

  // Vehicle Information (optional)
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;

  // Financial Details
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;

  // Additional Info
  notes?: string;
  signature_data?: string;

  // Business Details Overrides
  business_name?: string;
  business_email?: string;
  business_address?: string;
  business_phone?: string;
  business_website?: string;
  business_workshop_location?: string;

  // Relationships
  booking_id?: number;
  invoice_id?: number;

  // Metadata
  created_by: string;
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  accepted_at?: string;

  // Virtual fields (from joins)
  line_items?: LineItem[];
  photos?: DocumentPhoto[];
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';

  // Client Information
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_mobile?: string;
  client_fax?: string;

  // Vehicle Information (optional)
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;

  // Financial Details
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;

  // Payment Information
  payment_method?: string;
  payment_date?: string;
  payment_reference?: string;

  // Bank Details
  bank_account_name?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  bank_account_type?: string;

  // Additional Info
  notes?: string;
  signature_data?: string;

  // Business Details Overrides
  business_name?: string;
  business_email?: string;
  business_address?: string;
  business_phone?: string;
  business_website?: string;
  business_workshop_location?: string;

  // Relationships
  estimate_id?: number;
  booking_id?: number;

  // Metadata
  created_by: string;
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  paid_at?: string;

  // Virtual fields (from joins)
  line_items?: LineItem[];
  photos?: DocumentPhoto[];
}

export interface BusinessSettings {
  id: number;
  business_name: string;
  email: string;
  address: string;
  workshop_location?: string;
  phone: string;
  vat_number?: string;
  website?: string;
  owner_name?: string;

  bank_account_name?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  bank_account_type?: string;

  default_estimate_notes?: string;
  default_invoice_notes?: string;

  updated_at?: string;
}

// Form data interfaces
export interface EstimateFormData {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_mobile?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;
  notes?: string;
  line_items: LineItem[];
}

export interface InvoiceFormData {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_mobile?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;
  due_date?: string;
  notes?: string;
  line_items: LineItem[];
}

// ============================================
// DAMAGE ASSESSMENT TYPES
// ============================================

export interface DamageItem {
  section: string;           // e.g., "Engine Bay", "Structural", "Front End"
  component: string;         // e.g., "Subframe", "Coolant Radiator"
  damage: string;            // Description of damage
  assessment: string;        // e.g., "Replace", "Inspect", "Structural integrity compromised"
  priority: 'critical' | 'high' | 'medium' | 'low';
  status?: string;           // e.g., "Replace", "Inspect"
}

export interface CostEstimate {
  category: string;          // e.g., "Structural - Subframe"
  components: string;        // e.g., "Subframe replacement, brackets, mounting points"
  parts_min: number;
  parts_max: number;
  labour_min: number;
  labour_max: number;
  subtotal_min: number;
  subtotal_max: number;
}

export interface CriticalIssue {
  title: string;
  description: string;
}

export interface DamageAssessment {
  id?: number;

  // Vehicle Information
  vehicle_reg: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_engine?: string;
  vehicle_colour?: string;
  vehicle_first_registered?: string;
  vehicle_mot_status?: string;
  vehicle_tax_status?: string;

  // Assessment Details
  assessment_date: string;
  assessor_name?: string;
  video_url?: string;

  // Summary Counts
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_items: number;
  photo_count: number;

  // Critical Issues Summary
  critical_issues: CriticalIssue[];

  // All Damage Items
  damage_items: DamageItem[];

  // Cost Estimates
  cost_estimates: CostEstimate[];

  // Totals
  repair_cost_min: number;
  repair_cost_max: number;
  vehicle_value_min: number;
  vehicle_value_max: number;

  // Insurance Recommendation
  recommendation?: 'write-off' | 'repair' | 'undecided';
  write_off_category?: 'A' | 'B' | 'S' | 'N';
  recommendation_notes?: string;

  // General Notes
  notes?: string;

  // Share Link
  share_token?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// ============================================
// JOTTER NOTES TYPES
// ============================================

export interface JotterNote {
  id?: number;
  note_number: string;
  note_date: string;
  status: 'draft' | 'active' | 'converted';

  // Customer Information
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;

  // Vehicle Information
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;
  vehicle_year?: string;

  // Issue/Notes
  issue_description?: string;
  notes?: string;
  raw_input?: string;
  confidence_score?: number;

  // Relationships
  booking_id?: number;
  estimate_id?: number;

  // Metadata
  created_by: string;
  created_at?: string;
  updated_at?: string;
  converted_at?: string;
}

// ============================================
// RECEIPTS TYPES
// ============================================

export interface Receipt {
  id?: number;
  receipt_number: string;
  receipt_date: string;

  // Receipt Details
  supplier: string;
  description?: string;
  amount: number;
  category?: 'fuel' | 'parts' | 'tools' | 'supplies' | 'misc';

  // Google Drive Reference
  gdrive_file_id?: string;
  gdrive_file_url?: string;
  gdrive_folder_path?: string;
  original_filename?: string;

  // Status
  status: 'pending' | 'processed' | 'archived';

  // Metadata
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReceiptFormData {
  supplier: string;
  description?: string;
  amount: number;
  receipt_date: string;
  category?: 'fuel' | 'parts' | 'tools' | 'supplies' | 'misc';
  imageData: string;
}

// ============================================
// INVOICE EXPENSES TYPES
// ============================================

export interface InvoiceExpense {
  id?: number;
  invoice_id: number;

  // Extracted OCR Data
  expense_date?: string;
  supplier?: string;
  reference_number?: string;
  description?: string;

  // Amount Breakdown (Parts + Labour/Services combined)
  parts_amount: number;
  labour_amount: number;
  total_amount: number;

  // Category
  category?: 'parts' | 'labour' | 'mixed' | 'general';

  // OCR Metadata
  raw_ocr_text?: string;
  confidence_score?: number;

  // Metadata
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceExpenseFormData {
  invoice_id: number;
  expense_date?: string;
  supplier?: string;
  reference_number?: string;
  description?: string;
  parts_amount: number;
  labour_amount: number;
  category?: 'parts' | 'labour' | 'mixed' | 'general';
}

// ============================================
// DISCLAIMER TYPES
// ============================================

export interface Disclaimer {
  id?: number;
  disclaimer_number: string;        // DS-YYYYMMDD-XXX
  procedure_description: string;

  // Optional additional disclaimers
  include_existing_parts_disclaimer: boolean;
  include_diagnostic_payment_disclaimer: boolean;

  // Customer information
  customer_name?: string;
  customer_address?: string;
  customer_email?: string;
  customer_signature?: string;      // Base64 PNG
  signature_date?: string;

  // Vehicle information
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;

  // Status tracking
  status: 'pending' | 'signed';

  // Share link
  share_token?: string;

  // Metadata
  created_by: string;
  created_at?: string;
  updated_at?: string;
  signed_at?: string;
}

export interface DisclaimerFormData {
  procedure_description: string;
  include_existing_parts_disclaimer?: boolean;
  include_diagnostic_payment_disclaimer?: boolean;
  customer_name?: string;
  customer_address?: string;
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;
}

// ============================================
// CLIENT TYPES
// ============================================

export interface Client {
  id?: number;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  notes?: string;
}
