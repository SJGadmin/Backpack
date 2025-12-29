import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Convert cookies to the format iron-session expects
  const req = {
    headers: {
      cookie: request.cookies.toString(),
    },
  };

  const res = {
    getHeader: (name: string) => response.headers.get(name),
    setHeader: (name: string, value: string) => response.headers.set(name, value),
  };

  const session = await getIronSession<SessionData>(req as any, res as any, sessionOptions);

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
