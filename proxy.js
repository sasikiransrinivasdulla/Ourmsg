import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for session token
  const token = request.cookies.get('session_token')?.value;
  const verifiedToken = token && (await verifyJwtToken(token));

  if (!verifiedToken) {
    // If not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If going to root, redirect to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add the user info to the request headers so API routes can access it if needed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user', JSON.stringify(verifiedToken));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
