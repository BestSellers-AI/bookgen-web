import axios from 'axios';
import { apiClient } from '../api-client';
import type { SharedBookInfo, SharedBookPublicView } from './types';

const publicClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export const shareApi = {
  create: (bookId: string) =>
    apiClient
      .post<SharedBookInfo>(`/books/${bookId}/share`)
      .then((r) => r.data),

  get: (bookId: string) =>
    apiClient
      .get<SharedBookInfo>(`/books/${bookId}/share`)
      .then((r) => r.data),

  delete: (bookId: string, shareId: string) =>
    apiClient
      .delete<Record<string, unknown>>(`/books/${bookId}/share/${shareId}`)
      .then((r) => r.data),

  getPublic: (token: string) =>
    publicClient
      .get<SharedBookPublicView>(`/share/${token}`)
      .then((r) => r.data),
};
