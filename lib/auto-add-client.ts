import pool from '@/lib/db';

interface ClientData {
  name: string;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  mobile?: string | null;
  vehicle_reg?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  created_by?: string;
}

/**
 * Auto-add a client to the clients table if they don't already exist.
 * Checks for existing client by matching name AND (phone OR vehicle_reg).
 * This is called automatically when creating bookings, estimates, invoices, or vehicle reports.
 */
export async function autoAddClient(data: ClientData): Promise<void> {
  const { name, email, address, phone, mobile, vehicle_reg, vehicle_make, vehicle_model, created_by = 'Auto' } = data;

  // Skip if no name provided
  if (!name || !name.trim()) {
    return;
  }

  const trimmedName = name.trim();
  const upperVehicleReg = vehicle_reg?.trim().toUpperCase() || null;

  try {
    // Check if client already exists
    // Need to handle null parameters carefully for PostgreSQL type inference
    let existingClient = false;

    // Check by name + phone if phone is provided
    if (phone) {
      const phoneCheck = await pool.query(
        `SELECT id FROM clients
         WHERE LOWER(TRIM(name)) = LOWER($1) AND phone = $2
         LIMIT 1`,
        [trimmedName, phone]
      );
      if (phoneCheck.rows.length > 0) {
        existingClient = true;
      }
    }

    // Check by name + vehicle_reg if vehicle_reg is provided (and not already found)
    if (!existingClient && upperVehicleReg) {
      const regCheck = await pool.query(
        `SELECT id FROM clients
         WHERE LOWER(TRIM(name)) = LOWER($1)
         AND UPPER(REPLACE(vehicle_reg, ' ', '')) = UPPER(REPLACE($2, ' ', ''))
         LIMIT 1`,
        [trimmedName, upperVehicleReg]
      );
      if (regCheck.rows.length > 0) {
        existingClient = true;
      }
    }

    // If no phone or vehicle_reg, check by name only
    if (!existingClient && !phone && !upperVehicleReg) {
      const nameCheck = await pool.query(
        `SELECT id FROM clients WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [trimmedName]
      );
      if (nameCheck.rows.length > 0) {
        existingClient = true;
      }
    }

    if (existingClient) {
      // Client already exists, skip
      return;
    }

    // Insert new client
    await pool.query(
      `INSERT INTO clients (
        name, email, address, phone, mobile,
        vehicle_reg, vehicle_make, vehicle_model, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        trimmedName,
        email || null,
        address || null,
        phone || null,
        mobile || null,
        upperVehicleReg,
        vehicle_make || null,
        vehicle_model || null,
        created_by
      ]
    );

    console.log(`Auto-added client: ${trimmedName}`);
  } catch (error) {
    // Log but don't fail the main operation if client auto-add fails
    console.error('Failed to auto-add client:', error);
  }
}
