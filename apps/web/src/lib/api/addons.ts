import { apiClient } from '../api-client';
import type { BookAddonSummary } from './types';
import type { ProductKind } from '@bestsellers/shared';

export interface RequestAddonInput {
  kind: ProductKind;
  params?: Record<string, unknown>;
}

export const addonsApi = {
  create: (bookId: string, data: RequestAddonInput) =>
    apiClient
      .post<BookAddonSummary>(`/books/${bookId}/addons`, data)
      .then((r) => r.data),

  list: (bookId: string) =>
    apiClient
      .get<BookAddonSummary[]>(`/books/${bookId}/addons`)
      .then((r) => r.data),

  getById: (bookId: string, addonId: string) =>
    apiClient
      .get<BookAddonSummary>(`/books/${bookId}/addons/${addonId}`)
      .then((r) => r.data),

  cancel: (bookId: string, addonId: string) =>
    apiClient
      .delete<Record<string, unknown>>(`/books/${bookId}/addons/${addonId}`)
      .then((r) => r.data),

  createBundle: (bookId: string, bundleId: string, params?: Record<string, unknown>) =>
    apiClient
      .post<BookAddonSummary[]>(`/books/${bookId}/addons/bundle/${bundleId}`, { params })
      .then((r) => r.data),

  selectCover: (bookId: string, fileId: string) =>
    apiClient
      .patch<{ coverUrl: string }>(`/books/${bookId}/addons/cover/${fileId}`)
      .then((r) => r.data),

  selectChapterImage: (bookId: string, chapterId: string, imageId: string) =>
    apiClient
      .patch<{ imageUrl: string }>(`/books/${bookId}/addons/chapters/${chapterId}/image/${imageId}`)
      .then((r) => r.data),
};
