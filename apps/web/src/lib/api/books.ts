import { apiClient } from '../api-client';
import type {
  BookDetail,
  BookListItem,
  BookPlanning,
  PaginatedResponse,
} from './types';
import type { BookCreationMode, BookStatus } from '@bestsellers/shared';

export interface CreateBookInput {
  mode: BookCreationMode;
  briefing: string;
  author: string;
  title?: string;
  subtitle?: string;
  settings?: {
    tone: string;
    targetAudience: string;
    language: string;
    pageTarget: number;
    chapterCount: number;
    writingStyle?: string;
    includeExamples: boolean;
    includeCaseStudies: boolean;
    customInstructions?: string;
  };
}

export interface BookQueryParams {
  page?: number;
  perPage?: number;
  sortOrder?: 'asc' | 'desc';
  status?: BookStatus;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'updatedAt';
}

export interface UpdatePlanningInput {
  chapters: Array<{ title: string; topics: Array<{ title: string; content: string }> }>;
  conclusion?: string;
  glossary?: string[];
  title?: string;
  subtitle?: string;
  author?: string;
}

export const booksApi = {
  list: (params?: BookQueryParams) =>
    apiClient
      .get<PaginatedResponse<BookListItem>>('/books', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<BookDetail>(`/books/${id}`).then((r) => r.data),

  create: (data: CreateBookInput) =>
    apiClient.post<BookDetail>('/books', data).then((r) => r.data),

  generatePreview: (id: string) =>
    apiClient.post<{ message: string }>(`/books/${id}/preview`).then((r) => r.data),

  getPreviewStatus: (id: string) =>
    apiClient
      .get<{ status: string; planning?: BookPlanning }>(`/books/${id}/preview-status`)
      .then((r) => r.data),

  updatePlanning: (id: string, data: UpdatePlanningInput) =>
    apiClient.patch<BookDetail>(`/books/${id}/planning`, data).then((r) => r.data),

  approve: (id: string) =>
    apiClient.post<{ message: string }>(`/books/${id}/approve`).then((r) => r.data),

  generate: (id: string) =>
    apiClient.post<{ message: string }>(`/books/${id}/generate`).then((r) => r.data),

  regenerateChapter: (bookId: string, chapterSequence: number) =>
    apiClient
      .post<{ message: string }>(`/books/${bookId}/chapters/${chapterSequence}/regenerate`)
      .then((r) => r.data),

  retry: (id: string) =>
    apiClient.post<{ message: string }>(`/books/${id}/retry`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/books/${id}`).then((r) => r.data),
};
