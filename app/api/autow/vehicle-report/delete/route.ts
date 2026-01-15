import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    // Check if report exists and belongs to the user
    const checkResult = await client.query(
      'SELECT id FROM vehicle_reports WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete the report
    await client.query('DELETE FROM vehicle_reports WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  } finally {
    client.release();
  }
}
