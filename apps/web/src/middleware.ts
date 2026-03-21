import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const BSID_COOKIE = 'bsid';
const UTM_COOKIE = 'bs_utm';
const BSID_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const UTM_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  if (!(response instanceof NextResponse)) return response;

  // 1. Generate bsid if not present
  if (!request.cookies.get(BSID_COOKIE)) {
    response.cookies.set(BSID_COOKIE, generateId(), {
      maxAge: BSID_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // 2. Capture UTMs from URL if present
  const url = request.nextUrl;
  const utms: Record<string, string> = {};
  let hasUtm = false;

  for (const param of UTM_PARAMS) {
    const value = url.searchParams.get(param);
    if (value) {
      utms[param] = value;
      hasUtm = true;
    }
  }

  if (hasUtm) {
    response.cookies.set(UTM_COOKIE, JSON.stringify(utms), {
      maxAge: UTM_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
