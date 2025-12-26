-- AUTOW Booking System Database Schema
-- PostgreSQL Database Schema

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booked_by VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_reg VARCHAR(20) NOT NULL,
    location_address TEXT NOT NULL,
    location_postcode VARCHAR(20) NOT NULL,
    issue_description TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    estimated_duration INTEGER NOT NULL DEFAULT 90,
    calendar_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on booking_date for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_reg ON bookings(vehicle_reg);

-- Create function to check availability
CREATE OR REPLACE FUNCTION check_availability(
    p_booking_date DATE,
    p_booking_time TIME,
    p_estimated_duration INTEGER
)
RETURNS TABLE(available BOOLEAN) AS $$
DECLARE
    v_end_time TIME;
    v_conflict_count INTEGER;
BEGIN
    -- Calculate the end time of the requested booking
    v_end_time := p_booking_time + (p_estimated_duration || ' minutes')::INTERVAL;

    -- Check for overlapping bookings
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE booking_date = p_booking_date
      AND status != 'cancelled'
      AND (
          -- New booking starts during existing booking
          (p_booking_time >= booking_time
           AND p_booking_time < booking_time + (estimated_duration || ' minutes')::INTERVAL)
          OR
          -- New booking ends during existing booking
          (v_end_time > booking_time
           AND v_end_time <= booking_time + (estimated_duration || ' minutes')::INTERVAL)
          OR
          -- New booking completely contains existing booking
          (p_booking_time <= booking_time
           AND v_end_time >= booking_time + (estimated_duration || ' minutes')::INTERVAL)
      );

    -- Return true if no conflicts found
    RETURN QUERY SELECT (v_conflict_count = 0);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - remove in production)
-- INSERT INTO bookings (
--     booked_by, booking_date, booking_time, service_type,
--     customer_name, customer_phone, customer_email,
--     vehicle_make, vehicle_model, vehicle_reg,
--     location_address, location_postcode, issue_description,
--     notes, status, estimated_duration
-- ) VALUES (
--     'Admin',
--     CURRENT_DATE + 1,
--     '10:00:00',
--     'Mobile Mechanic',
--     'John Smith',
--     '07123456789',
--     'john.smith@example.com',
--     'Ford',
--     'Focus',
--     'AB12 CDE',
--     '123 Main Street',
--     'SW1A 1AA',
--     'Oil change and general service',
--     'Customer prefers morning appointments',
--     'confirmed',
--     90
-- );
