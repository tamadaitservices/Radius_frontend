import { NextRequest, NextResponse } from 'next/server';

// Always point to Railway backend. Never use a relative/Vercel URL here or it loops.
const BACKEND = 'https://radiuyes-backend.up.railway.app';

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${BACKEND}${pathname}${search}`;

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (!['host', 'connection', 'transfer-encoding'].includes(k)) {
      headers[k] = v;
    }
  });
  headers['x-forwarded-host'] = req.headers.get('host') || '';

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    if (!['transfer-encoding', 'connection'].includes(k)) {
      responseHeaders.set(k, v);
    }
  });

  const data = await upstream.arrayBuffer();
  return new NextResponse(data, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
