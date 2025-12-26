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
