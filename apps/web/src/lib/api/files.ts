import { apiClient } from '../api-client';
import type { BookFileSummary } from './types';

export const filesApi = {
  list: (bookId: string) =>
    apiClient
      .get<BookFileSummary[]>(`/books/${bookId}/files`)
      .then((r) => r.data),

  getDownloadUrl: (bookId: string, fileId: string) =>
    apiClient
      .get<{ url: string }>(`/books/${bookId}/files/${fileId}/download`)
      .then((r) => r.data),
};
