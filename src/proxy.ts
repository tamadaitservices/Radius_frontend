import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const { pathname } = req.nextUrl;

  // In local dev (incl. LAN IP for testing on a phone) or Vercel preview, skip subdomain
  // routing — access panels via /admin and /vendor/dashboard directly
  const isLanIp = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(host);
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.endsWith('.vercel.app') || isLanIp) {
    return NextResponse.next();
  }

  const isAdmin = host.startsWith('admin.');
  const isVendor = host.startsWith('vendor.');

  // ── Admin subdomain ────────────────────────────────────────────
  if (isAdmin) {
    const url = req.nextUrl.clone();
    // / → /admin, /login → /admin/login, etc.
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Vendor subdomain ───────────────────────────────────────────
  if (isVendor) {
    const url = req.nextUrl.clone();
    if (pathname === '/') {
      url.pathname = '/vendor/dashboard';
    } else if (!pathname.startsWith('/vendor')) {
      url.pathname = `/vendor${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // ── Main domain — /admin and /vendor paths work directly here.
  // No admin./vendor. subdomains are deployed, so don't redirect away from them.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
