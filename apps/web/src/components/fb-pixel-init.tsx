'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

/**
 * Initializes the Facebook Pixel with advanced matching (user data).
 * Re-inits when the user logs in to upgrade match quality.
 * Must be placed inside a NextIntlClientProvider (locale layout).
 */
export function FbPixelInit() {
  const user = useAuthStore((s) => s.user);
  const initialized = useRef(false);

  useEffect(() => {
    if (!FB_PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;

    // Build advanced matching data
    const userData: Record<string, string> = {};
    if (user?.email) userData.em = user.email;
    if (user?.name) userData.fn = user.name.split(' ')[0]?.toLowerCase() ?? '';
    if (user?.name?.includes(' '))
      userData.ln = user.name.split(' ').slice(1).join(' ').toLowerCase();

    if (!initialized.current) {
      // First init with user data (if available)
      window.fbq('init', FB_PIXEL_ID, Object.keys(userData).length > 0 ? userData : undefined);
      window.fbq('track', 'PageView');
      initialized.current = true;
    } else if (user?.email) {
      // User just logged in — re-init with user data for better matching
      window.fbq('init', FB_PIXEL_ID, userData);
    }
  }, [user?.email, user?.name]);

  return null;
}
