import type { ChapterDetail } from './book';

export interface SharedBookInfo {
  id: string;
  shareToken: string;
  isActive: boolean;
  viewCount: number;
  expiresAt: string | null;
  shareUrl: string;
  createdAt: string;
}

export interface SharedBookPublicView {
  title: string;
  subtitle: string | null;
  author: string;
  introduction: string | null;
  conclusion: string | null;
  finalConsiderations: string | null;
  glossary: string | null;
  appendix: string | null;
  closure: string | null;
  chapters: ChapterDetail[];
  coverUrl: string | null;
  wordCount: number | null;
  pageCount: number | null;
}
