import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete line items first (foreign key constraint)
      await client.query(
        'DELETE FROM line_items WHERE document_type = $1 AND document_id = $2',
        ['estimate', id]
      );

      // Delete photos
      await client.query(
        'DELETE FROM document_photos WHERE document_type = $1 AND document_id = $2',
        ['estimate', id]
      );

      // Delete estimate
      const result = await client.query(
        'DELETE FROM estimates WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Estimate deleted successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimate', details: error.message },
      { status: 500 }
    );
  }
}
