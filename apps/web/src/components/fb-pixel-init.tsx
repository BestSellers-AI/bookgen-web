'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

/**
 * Re-initializes the Facebook Pixel with advanced matching data when the user logs in.
 * The initial init + PageView is handled in the root layout inline script.
 */
export function FbPixelInit() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!FB_PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
    if (!user?.email) return;

    // Re-init with user data for better match quality
    const userData: Record<string, string> = { em: user.email };
    if (user.name) {
      userData.fn = user.name.split(' ')[0]?.toLowerCase() ?? '';
      if (user.name.includes(' '))
        userData.ln = user.name.split(' ').slice(1).join(' ').toLowerCase();
    }

    window.fbq('init', FB_PIXEL_ID, userData);
  }, [user?.email, user?.name]);

  return null;
}
