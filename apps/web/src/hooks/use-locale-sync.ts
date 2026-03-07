'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import type { Locale } from '@/i18n/config';

export function useLocaleSync() {
  const urlLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const synced = useRef(false);

  useEffect(() => {
    if (!user?.locale || synced.current) return;

    if (user.locale !== urlLocale) {
      synced.current = true;
      router.replace(pathname, { locale: user.locale as Locale });
    }
  }, [user?.locale, urlLocale, router, pathname]);

  // Reset sync flag when user changes (logout/login)
  useEffect(() => {
    synced.current = false;
  }, [user?.id]);
}
