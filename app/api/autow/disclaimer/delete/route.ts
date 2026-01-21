import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Disclaimer ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check if disclaimer exists
      const checkResult = await client.query(
        'SELECT id FROM disclaimers WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: 'Disclaimer not found' }, { status: 404 });
      }

      // Delete the disclaimer
      await client.query('DELETE FROM disclaimers WHERE id = $1', [id]);

      return NextResponse.json({ success: true });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting disclaimer:', error);
    return NextResponse.json({ error: 'Failed to delete disclaimer' }, { status: 500 });
  }
}
