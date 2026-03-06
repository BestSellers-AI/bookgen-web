import {
  BookStatus,
  BookCreationMode,
  ChapterStatus,
  FileType,
  AddonStatus,
  ProductKind,
  TranslationStatus,
} from '../enums';
import type { BookTone } from '../constants';

export interface BookListItem {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  status: BookStatus;
  creationMode: BookCreationMode;
  chaptersCount: number;
  completedChaptersCount: number;
  coverUrl: string | null;
  wordCount: number | null;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterSummary {
  id: string;
  sequence: number;
  title: string;
  status: ChapterStatus;
  wordCount: number | null;
  isEdited: boolean;
}

export interface ChapterDetail extends ChapterSummary {
  content: string | null;
  editedContent: string | null;
  topics: Array<{ title: string; content?: string }> | null;
  contextSummary: string | null;
}

export interface BookFileSummary {
  id: string;
  fileType: FileType;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  createdAt: string;
}

export interface BookAddonSummary {
  id: string;
  kind: ProductKind;
  status: AddonStatus;
  resultUrl: string | null;
  resultData: Record<string, unknown> | null;
  creditsCost: number | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookTranslationSummary {
  id: string;
  targetLanguage: string;
  status: TranslationStatus;
  translatedTitle: string | null;
  translatedSubtitle: string | null;
  totalChapters: number;
  completedChapters: number;
  createdAt: string;
}

export interface AudiobookSummaryRef {
  id: string;
  voiceName: string | null;
  status: AddonStatus;
  totalDuration: number | null;
  fullAudioUrl: string | null;
  createdAt: string;
}

export interface BookImageSummary {
  id: string;
  chapterId: string | null;
  prompt: string;
  imageUrl: string;
  caption: string | null;
  position: number;
  createdAt: string;
}

export interface SharedBookSummary {
  id: string;
  shareToken: string;
  isActive: boolean;
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface BookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  briefing: string;
  status: BookStatus;
  creationMode: BookCreationMode;
  planning: BookPlanning | null;
  settings: AdvancedSettings | null;
  introduction: string | null;
  conclusion: string | null;
  finalConsiderations: string | null;
  glossary: string | null;
  resourcesReferences: string | null;
  appendix: string | null;
  closure: string | null;
  wordCount: number | null;
  pageCount: number | null;
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  generationError: string | null;
  chapters: ChapterDetail[];
  files: BookFileSummary[];
  addons: BookAddonSummary[];
  translations: BookTranslationSummary[];
  audiobooks: AudiobookSummaryRef[];
  images: BookImageSummary[];
  share: SharedBookSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookPlanning {
  chapters: Array<{
    title: string;
    topics: string[];
  }>;
  conclusion?: string;
  glossary?: string[];
}

export interface AdvancedSettings {
  tone: BookTone;
  targetAudience: string;
  language: string;
  pageTarget: number;
  chapterCount: number;
  writingStyle?: string;
  includeExamples: boolean;
  includeCaseStudies: boolean;
  customInstructions?: string;
}
