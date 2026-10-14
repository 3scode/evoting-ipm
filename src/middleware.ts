import { NextResponse, type NextRequest } from 'next/server';

function getCookie(req: NextRequest, name: string) {
  return req.cookies.get(name)?.value;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/kiosk/vote') || pathname.startsWith('/kiosk/ballot') || pathname.startsWith('/kiosk/success')) {
    const kiosk = getCookie(req, 'kiosk-session');
    if (!kiosk && pathname !== '/kiosk/login') {
      return NextResponse.redirect(new URL('/kiosk/login', req.url));
    }
    if (pathname.startsWith('/kiosk/ballot')) {
      const verified = getCookie(req, 'voter-verified');
      if (!verified) return NextResponse.redirect(new URL('/kiosk/vote', req.url));
    }
  }
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const hasSession = req.cookies.getAll().some((c) => c.name.endsWith('-auth-token'));
    if (!hasSession) return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/kiosk/:path*', '/admin/:path*'] };
