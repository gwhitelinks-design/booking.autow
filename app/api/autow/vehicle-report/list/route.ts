import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = `
      SELECT * FROM vehicle_reports
      ${status && status !== 'all' ? 'WHERE status = $1' : ''}
      ORDER BY created_at DESC
    `;

    const result = status && status !== 'all'
      ? await pool.query(query, [status])
      : await pool.query(query);

    return NextResponse.json({ reports: result.rows });

  } catch (error: any) {
    console.error('Error listing vehicle reports:', error);
    return NextResponse.json({ error: 'Failed to list vehicle reports', details: error.message }, { status: 500 });
  }
}
