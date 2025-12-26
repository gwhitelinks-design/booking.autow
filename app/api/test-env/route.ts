import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const username = process.env.AUTOW_STAFF_USERNAME;
  const password = process.env.AUTOW_STAFF_PASSWORD;

  return NextResponse.json({
    hasUsername: !!username,
    hasPassword: !!password,
    hasToken: !!process.env.AUTOW_STAFF_TOKEN,
    usernameValue: username, // Show actual value to debug
    usernameLength: username?.length || 0,
    passwordLength: password?.length || 0,
    passwordFirst3: password?.substring(0, 3), // First 3 chars to verify
    tokenLength: process.env.AUTOW_STAFF_TOKEN?.length || 0,
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('AUTOW')),
  });
}
