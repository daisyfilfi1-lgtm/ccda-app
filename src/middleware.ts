import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';

const protectedRoutes = ['/assessment', '/daily', '/interests', '/quiz', '/achievement', '/onboarding'];
const publicRoutes = ['/auth', '/parent-report'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if route needs auth
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected && !isPublic) {
    return NextResponse.next();
  }

  // Create Supabase client with request cookies
  const supabase = createServerSideClient(request.headers.get('cookie') || '');

  // Check session
  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected) {
    if (!user) {
      const url = new URL('/auth', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // For public routes, no redirect needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
