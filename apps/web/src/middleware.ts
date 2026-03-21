import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const BSID_COOKIE = 'bsid';
const UTM_COOKIE = 'bs_utm';
const DEVICE_COOKIE = 'bs_device';
const BSID_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const UTM_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const DEVICE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function detectDeviceType(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  if (!(response instanceof NextResponse)) return response;

  const cookieOpts = {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };

  // 1. Generate bsid if not present
  if (!request.cookies.get(BSID_COOKIE)) {
    response.cookies.set(BSID_COOKIE, generateId(), {
      ...cookieOpts,
      maxAge: BSID_MAX_AGE,
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
      ...cookieOpts,
      maxAge: UTM_MAX_AGE,
    });
  }

  // 3. Capture device info (once, on first visit)
  if (!request.cookies.get(DEVICE_COOKIE)) {
    const ua = request.headers.get('user-agent') ?? '';
    const acceptLang = request.headers.get('accept-language') ?? '';
    const browserLanguage = acceptLang.split(',')[0]?.trim() || null;
    const deviceType = detectDeviceType(ua);

    // Vercel geo headers (populated automatically on Vercel, null elsewhere)
    const geoCountry = request.headers.get('x-vercel-ip-country') ?? null;
    const geoCity = request.headers.get('x-vercel-ip-city') ?? null;

    const deviceData: Record<string, string | null> = {
      deviceType,
      browserLanguage,
      geoCountry,
      geoCity,
    };

    response.cookies.set(DEVICE_COOKIE, JSON.stringify(deviceData), {
      ...cookieOpts,
      maxAge: DEVICE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
