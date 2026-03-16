import { apiClient } from '../api-client';
import type { TranslationDetail, BookTranslationSummary } from './types';

export const translationsApi = {
  list: async (bookId: string): Promise<BookTranslationSummary[]> => {
    const { data } = await apiClient.get(`/books/${bookId}/translations`);
    return data;
  },

  getById: async (bookId: string, translationId: string): Promise<TranslationDetail> => {
    const { data } = await apiClient.get(`/books/${bookId}/translations/${translationId}`);
    return data;
  },
};
