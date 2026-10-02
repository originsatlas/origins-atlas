import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, ADMIN_COOKIE_NAME } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    // Login route handling
    if (pathname === '/admin/login') {
      if (sessionCookie) {
        const session = await verifySessionToken(sessionCookie);
        if (session) {
          // Already authenticated, redirect to admin dashboard
          const next = request.nextUrl.searchParams.get('next') || '/admin';
          return NextResponse.redirect(new URL(next, request.url));
        }
      }
      return NextResponse.next();
    }

    // Protected admin routes: require valid session
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySessionToken(sessionCookie);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(ADMIN_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

export default proxy;
