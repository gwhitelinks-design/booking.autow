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
      // Get the first user's ID (assuming single user system)
      // Try different possible table names
      let userResult;
      try {
        userResult = await client.query('SELECT id FROM users LIMIT 1');
      } catch (e) {
        try {
          userResult = await client.query('SELECT id FROM autow_users LIMIT 1');
        } catch (e2) {
          // Just set user_id to 1 for all records
          const estimatesResult = await client.query('UPDATE estimates SET user_id = 1 WHERE user_id IS NULL');
          const invoicesResult = await client.query('UPDATE invoices SET user_id = 1 WHERE user_id IS NULL');

          return NextResponse.json({
            success: true,
            message: `Updated ${estimatesResult.rowCount} estimates and ${invoicesResult.rowCount} invoices with user_id 1 (default)`
          });
        }
      }

      if (userResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No users found in database'
        }, { status: 400 });
      }

      const userId = userResult.rows[0].id;

      // Update all estimates without user_id
      const estimatesResult = await client.query(
        'UPDATE estimates SET user_id = $1 WHERE user_id IS NULL',
        [userId]
      );

      // Update all invoices without user_id
      const invoicesResult = await client.query(
        'UPDATE invoices SET user_id = $1 WHERE user_id IS NULL',
        [userId]
      );

      return NextResponse.json({
        success: true,
        message: `Updated ${estimatesResult.rowCount} estimates and ${invoicesResult.rowCount} invoices with user_id ${userId}`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Fix user IDs error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix user IDs'
    }, { status: 500 });
  }
}
