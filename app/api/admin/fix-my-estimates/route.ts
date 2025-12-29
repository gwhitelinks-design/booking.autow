import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = verifyToken(token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await pool.connect();

    try {
      // Update all estimates to belong to user_id 1 (single-user system)
      const estimatesResult = await client.query(
        'UPDATE estimates SET user_id = $1',
        [1]
      );

      // Update all invoices to belong to user_id 1 (single-user system)
      const invoicesResult = await client.query(
        'UPDATE invoices SET user_id = $1',
        [1]
      );

      return NextResponse.json({
        success: true,
        message: `Updated ${estimatesResult.rowCount} estimates and ${invoicesResult.rowCount} invoices to user_id 1`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Fix my estimates error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix estimates'
    }, { status: 500 });
  }
}
