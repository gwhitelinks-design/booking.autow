import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffCredentials, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isValid = verifyStaffCredentials(username, password);

    if (isValid) {
      const token = process.env.AUTOW_STAFF_TOKEN || generateToken();
      return NextResponse.json({
        success: true,
        token,
        username
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
