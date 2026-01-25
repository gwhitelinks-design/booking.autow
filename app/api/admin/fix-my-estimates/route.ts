import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Require admin authentication
  const session = await getSession();
  if (!session || !isAdmin(session)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
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
