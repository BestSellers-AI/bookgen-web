import { apiClient } from '../api-client';
import type { AuthResponse, UserProfile } from './types';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  locale?: string;
  phoneNumber?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string;
  locale?: string;
  phoneNumber?: string;
}

export const authApi = {
  register: (data: RegisterInput) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginInput) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  google: (idToken: string) =>
    apiClient.post<AuthResponse>('/auth/google', { idToken }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<{ message: string }>('/auth/logout', { refreshToken }).then((r) => r.data),

  getProfile: () =>
    apiClient.get<UserProfile>('/auth/profile').then((r) => r.data),

  updateProfile: (data: UpdateProfileInput) =>
    apiClient.patch<UserProfile>('/auth/profile', data).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (data: ResetPasswordInput) =>
    apiClient.post<{ message: string }>('/auth/reset-password', data).then((r) => r.data),
};
