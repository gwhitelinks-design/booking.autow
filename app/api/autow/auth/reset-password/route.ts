import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Look up user by reset token (using existing schema)
    const userResult = await pool.query(
      `SELECT id, email, contact_name as name
       FROM public.users
       WHERE password_reset_token = $1
         AND password_reset_expires > NOW()
         AND COALESCE(subscription_status = 'active', true)`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token (using existing schema)
    await pool.query(
      `UPDATE public.users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    console.log(`Password reset successful for ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
