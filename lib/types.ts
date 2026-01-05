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
  item_type: 'service' | 'part' | 'labor' | 'other';
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
