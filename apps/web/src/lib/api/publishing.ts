import { apiClient } from '../api-client';
import type { PublishingRequestSummary, AdminPublishingDetail, PaginatedResponse } from './types';

export const publishingApi = {
  // User endpoints
  listByBook: async (bookId: string): Promise<PublishingRequestSummary[]> => {
    const { data } = await apiClient.get(`/books/${bookId}/publishing`);
    return data;
  },
  getByBook: async (bookId: string, id: string): Promise<PublishingRequestSummary> => {
    const { data } = await apiClient.get(`/books/${bookId}/publishing/${id}`);
    return data;
  },

  // Admin endpoints
  list: async (params?: { page?: number; perPage?: number; search?: string; status?: string }): Promise<PaginatedResponse<AdminPublishingDetail>> => {
    const { data } = await apiClient.get('/admin/publishing', { params });
    return data;
  },
  getDetail: async (id: string): Promise<AdminPublishingDetail> => {
    const { data } = await apiClient.get(`/admin/publishing/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string): Promise<AdminPublishingDetail> => {
    const { data } = await apiClient.patch(`/admin/publishing/${id}/status`, { status });
    return data;
  },
  complete: async (id: string, body: { publishedUrl?: string; amazonAsin?: string; kdpUrl?: string; adminNotes?: string }): Promise<AdminPublishingDetail> => {
    const { data } = await apiClient.post(`/admin/publishing/${id}/complete`, body);
    return data;
  },
  cancel: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/admin/publishing/${id}`);
    return data;
  },
};
