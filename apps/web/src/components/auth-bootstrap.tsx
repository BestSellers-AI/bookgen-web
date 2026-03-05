'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api-client';

export function AuthBootstrap() {
  const ran = useRef(false);
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (!accessToken || !refreshToken) {
      setLoading(false);
      return;
    }

    authApi
      .getProfile()
      .then((user) => {
        setAuth(user, accessToken, refreshToken);
      })
      .catch(() => {
        tokenStorage.clear();
        clearAuth();
        setLoading(false);
      });
  }, [setAuth, clearAuth, setLoading]);

  return null;
}
