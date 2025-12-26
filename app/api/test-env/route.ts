import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasUsername: !!process.env.AUTOW_STAFF_USERNAME,
    hasPassword: !!process.env.AUTOW_STAFF_PASSWORD,
    hasToken: !!process.env.AUTOW_STAFF_TOKEN,
    usernameLength: process.env.AUTOW_STAFF_USERNAME?.length || 0,
    passwordLength: process.env.AUTOW_STAFF_PASSWORD?.length || 0,
    tokenLength: process.env.AUTOW_STAFF_TOKEN?.length || 0,
  });
}
