import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// JWT Secret - should be at least 32 characters
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'autow-jwt-secret-key-change-in-production-2026'
);

// Token expiry: 24 hours
const TOKEN_EXPIRY = '24h';

// Cookie settings
const COOKIE_NAME = 'autow_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 24 hours in seconds
};

export interface UserPayload extends JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export async function generateToken(user: {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'staff';
}): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT token (async)
export async function verifyJwtToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as UserPayload;
  } catch {
    return null;
  }
}

// Legacy verifyToken for API routes - checks static token
// Maintains backward compatibility with existing API routes
export function verifyToken(token: string | null): boolean {
  if (!token) return false;
  return token === process.env.AUTOW_STAFF_TOKEN;
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

// Get session from cookie
export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyJwtToken(token);
}

// Clear session cookie (logout)
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Generate password reset token (random 64 char hex)
export function generateResetToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// Legacy function for backward compatibility during migration
// This checks the old static token
export function verifyLegacyToken(token: string | null): boolean {
  if (!token) return false;
  return token === process.env.AUTOW_STAFF_TOKEN;
}

// Sync version for API routes - checks both JWT and legacy token
// Returns true if valid legacy token OR valid JWT token
export function verifyApiToken(token: string | null): boolean {
  if (!token) return false;
  // Check legacy token first (fast path)
  if (token === process.env.AUTOW_STAFF_TOKEN) {
    return true;
  }
  // JWT verification would need to be async, so for now
  // API routes using this function only support legacy tokens
  // The middleware handles JWT verification for protected routes
  return false;
}

// Check if user is admin
export function isAdmin(user: UserPayload | null): boolean {
  return user?.role === 'admin';
}
