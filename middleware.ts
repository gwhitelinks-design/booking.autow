import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT Secret - must match lib/auth.ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'autow-jwt-secret-key-change-in-production-2026'
);

const COOKIE_NAME = 'autow_session';

// Routes that don't require authentication
const publicRoutes = [
  '/autow', // Login page
  '/autow/forgot-password',
  '/autow/reset-password',
  '/share', // Public share links
  '/api/autow/auth/login',
  '/api/autow/auth/forgot-password',
  '/api/autow/auth/reset-password',
  '/api/share', // Public share APIs
];

// Admin-only routes
const adminRoutes = [
  '/api/admin',
  '/autow/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check for protected /autow/* routes and /api/autow/* routes
  if (pathname.startsWith('/autow') || pathname.startsWith('/api/autow')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    // Also check Authorization header for API backwards compatibility
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.replace('Bearer ', '');

    // Check legacy token for API routes during transition
    if (pathname.startsWith('/api/autow') && bearerToken) {
      if (bearerToken === process.env.AUTOW_STAFF_TOKEN) {
        // Legacy token is valid - allow through
        return NextResponse.next();
      }
    }

    // No session cookie
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        );
      }
      // For pages, redirect to login
      const loginUrl = new URL('/autow', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify JWT token
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Check admin routes
      if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (payload.role !== 'admin') {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Forbidden - Admin access required' },
              { status: 403 }
            );
          }
          return NextResponse.redirect(new URL('/autow/welcome', request.url));
        }
      }

      // Valid token - add user info to headers for API routes
      const response = NextResponse.next();
      response.headers.set('x-user-id', String(payload.userId));
      response.headers.set('x-user-email', String(payload.email));
      response.headers.set('x-user-role', String(payload.role));
      return response;
    } catch {
      // Invalid or expired token
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Session expired - Please log in again' },
          { status: 401 }
        );
      }
      // Clear invalid cookie and redirect to login
      const loginUrl = new URL('/autow', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Block dangerous endpoints completely (DELETE THESE IN PRODUCTION)
  if (pathname === '/api/test-env') {
    return NextResponse.json(
      { error: 'This endpoint has been disabled for security' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    '/autow/:path*',
    '/api/autow/:path*',
    '/api/admin/:path*',
    // Block dangerous endpoints
    '/api/test-env',
  ],
};
