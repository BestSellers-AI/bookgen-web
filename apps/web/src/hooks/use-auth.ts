'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi, type LoginInput, type RegisterInput, type UpdateProfileInput } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api-client';
import { useRouter } from '@/i18n/navigation';
import { getTrackingData } from '@/lib/tracking';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, setUser, clearAuth } =
    useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (data: LoginInput) => {
      const res = await authApi.login(data);
      tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.push('/dashboard');
    },
    [setAuth, router],
  );

  const signup = useCallback(
    async (data: RegisterInput) => {
      const tracking = getTrackingData();
      const res = await authApi.register({ ...tracking, ...data });
      tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.push('/dashboard');
    },
    [setAuth, router],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const tracking = getTrackingData();
      const res = await authApi.google({ idToken: credential, ...tracking });
      tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.push('/dashboard');
    },
    [setAuth, router],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore logout API errors — clear local state regardless
    }
    tokenStorage.clear();
    clearAuth();
    router.push('/auth/login');
  }, [clearAuth, router]);

  const updateProfile = useCallback(
    async (data: UpdateProfileInput) => {
      const updated = await authApi.updateProfile(data);
      setUser(updated);
    },
    [setUser],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,
  };
}
