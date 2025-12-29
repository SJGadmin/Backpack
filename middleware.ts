import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request.cookies, response.cookies, sessionOptions);

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const isPublicRoute = pathname === '/login';

  // If user is not logged in and trying to access protected route
  if (!isPublicRoute && !session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and trying to access login page, redirect to board
  if (isPublicRoute && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/board', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
