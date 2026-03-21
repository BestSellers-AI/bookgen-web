'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getVisitorId } from '@/lib/tracking';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Identifies the visitor in Microsoft Clarity using the bsid cookie.
 * After login, also associates the Clarity session with the user ID.
 */
export function ClarityIdentify() {
  const { user } = useAuth();

  useEffect(() => {
    const bsid = getVisitorId();
    if (!bsid || !window.clarity) return;

    if (user) {
      window.clarity('identify', bsid, undefined, undefined, user.id);
    } else {
      window.clarity('identify', bsid);
    }
  }, [user]);

  return null;
}
