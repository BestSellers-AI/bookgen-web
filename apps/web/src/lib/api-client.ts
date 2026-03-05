import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// ---------------------------------------------------------------------------
// Token helpers — localStorage backed
// ---------------------------------------------------------------------------
const ACCESS_KEY = 'bs_access_token';
const REFRESH_KEY = 'bs_refresh_token';

export const tokenStorage = {
  getAccessToken: () =>
    typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null,
  getRefreshToken: () =>
    typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null,
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — 401 → silent refresh with queue
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, not on the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue concurrent requests while refreshing
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${token}`,
        };
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      tokenStorage.clear();
      return Promise.reject(error);
    }

    try {
      const { data } = await apiClient.post('/auth/refresh', { refreshToken });
      const newAccess: string = data.tokens.accessToken;
      const newRefresh: string = data.tokens.refreshToken;
      tokenStorage.setTokens(newAccess, newRefresh);

      // Sync Zustand store with new tokens
      const store = useAuthStore.getState();
      if (store.user) {
        store.setAuth(store.user, newAccess, newRefresh);
      }

      processQueue(null, newAccess);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccess}`,
      };
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clear();
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
