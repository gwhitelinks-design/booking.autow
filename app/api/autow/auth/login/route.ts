import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken, setSessionCookie } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    // Support both email and username for backward compatibility
    const loginEmail = email || username;

    if (!loginEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Look up user by email (using existing schema from Parts Bot)
    const userResult = await pool.query(
      `SELECT id, email, password_hash, contact_name as name, role,
              COALESCE(subscription_status = 'active', true) as is_active
       FROM public.users
       WHERE email = $1`,
      [loginEmail.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Check legacy credentials during migration period
      const legacyUsername = process.env.AUTOW_STAFF_USERNAME || 'admin';
      const legacyPassword = process.env.AUTOW_STAFF_PASSWORD || 'autow2024';

      if (loginEmail === legacyUsername && password === legacyPassword) {
        // Legacy login - return old token for backward compatibility
        const legacyToken = process.env.AUTOW_STAFF_TOKEN || 'test-token-12345';
        return NextResponse.json({
          success: true,
          token: legacyToken,
          username: legacyUsername,
          message: 'Please create a proper account. Legacy login will be removed soon.',
          legacy: true,
        });
      }

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled. Contact admin.' },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Update last login time
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('autow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
