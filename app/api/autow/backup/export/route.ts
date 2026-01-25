import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/autow/backup/export
 * 
 * Exports all database tables as JSON for backup purposes.
 * Requires authentication via Bearer token.
 * 
 * Used by n8n daily backup workflow.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timestamp = new Date().toISOString();
    const tables: Record<string, { count: number; data: unknown[] }> = {};

    // Define tables to backup (AUTOW Booking tables only - not Parts Bot!)
    const tablesToBackup = [
      'bookings',
      'estimates', 
      'invoices',
      'line_items',
      'clients',
      'disclaimers',
      'jotter_notes',
      'receipts',
      'vehicle_reports',
      'mileage_logs',
      'expenses',
      'business_settings'
    ];

    // Export each table
    for (const tableName of tablesToBackup) {
      try {
        const result = await pool.query(
          `SELECT * FROM ${tableName} ORDER BY id`
        );
        tables[tableName] = {
          count: result.rows.length,
          data: result.rows
        };
      } catch (err) {
        // Table might not exist - log and continue
        console.log(`Skipping table ${tableName}:`, err instanceof Error ? err.message : err);
        tables[tableName] = {
          count: 0,
          data: []
        };
      }
    }

    // Calculate totals
    const totalRecords = Object.values(tables).reduce((sum, t) => sum + t.count, 0);

    const backup = {
      backup_timestamp: timestamp,
      backup_date: timestamp.split('T')[0],
      database: 'AUTOW Booking System',
      database_id: 'kctnocfwcomphprybnud',
      total_records: totalRecords,
      table_count: Object.keys(tables).length,
      tables
    };

    return NextResponse.json(backup);
    
  } catch (error) {
    console.error('Backup export error:', error);
    return NextResponse.json(
      { error: 'Backup export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
