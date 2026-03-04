export interface BookMeta {
  title: string;
  subtitle: string | null;
  author: string;
  briefing: string;
}

export interface PreviewRequest {
  bookId: string;
  meta: BookMeta;
  mode: string;
  settings?: Record<string, unknown>;
  callbackBaseUrl: string;
}

export interface PreviewResponse {
  title: string;
  subtitle: string | null;
  planning: {
    chapters: Array<{ title: string; topics: string[] }>;
    conclusion?: string;
    glossary?: string[];
  };
}

export interface IntroductionRequest {
  bookId: string;
  meta: BookMeta;
  planning: Record<string, unknown>;
  callbackBaseUrl: string;
}

export interface IntroductionResponse {
  content: string;
  wordCount: number;
}

export interface ChapterRequest {
  bookId: string;
  chapterSequence: number;
  chapterTitle: string;
  topics: string[];
  meta: BookMeta;
  previousContext?: string;
  callbackBaseUrl: string;
}

export interface ChapterResponse {
  title: string;
  content: string;
  topics: Array<{ title: string; content: string }>;
  contextSummary: string;
  wordCount: number;
}

export interface ConclusionRequest {
  bookId: string;
  meta: BookMeta;
  planning: Record<string, unknown>;
  chaptersContext: string[];
  callbackBaseUrl: string;
}

export interface ConclusionResponse {
  content: string;
  wordCount: number;
}

export interface CoverGenerationRequest {
  bookId: string;
  title: string;
  subtitle: string | null;
  author: string;
  genre?: string;
  styles: string[];
  variationCount: number;
  callbackBaseUrl: string;
}

export interface CoverGenerationResponse {
  variations: Array<{
    style: string;
    imageUrl: string;
    thumbnailUrl: string;
  }>;
}

export interface TranslateChapterRequest {
  bookId: string;
  translationId: string;
  chapterId: string;
  chapterSequence: number;
  originalTitle: string;
  originalContent: string;
  targetLanguage: string;
  callbackBaseUrl: string;
}

export interface TranslateChapterResponse {
  translatedTitle: string;
  translatedContent: string;
}

export interface ImageGenerationRequest {
  bookId: string;
  addonId: string;
  chapters: Array<{
    chapterId: string;
    title: string;
    contentSummary: string;
  }>;
  style?: string;
  callbackBaseUrl: string;
}

export interface ImageGenerationResponse {
  images: Array<{
    chapterId: string;
    imageUrl: string;
    prompt: string;
    caption: string;
  }>;
}

export interface AudiobookConfigRequest {
  bookId: string;
  addonId: string;
  voiceId?: string;
  chapters: Array<{
    chapterId: string;
    sequence: number;
    title: string;
    content: string;
  }>;
  callbackBaseUrl: string;
}

export interface AudiobookConfigResponse {
  audiobookId: string;
  chapters: Array<{
    chapterId: string;
    audioUrl: string;
    durationSecs: number;
  }>;
  fullAudioUrl: string;
  totalDuration: number;
}

export interface EngineHealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  activeWorkflows: number;
}

export interface GenerationProgress {
  bookId: string;
  status: string;
  chaptersCompleted?: number;
  totalChapters?: number;
  currentChapter?: number;
  error?: string;
}
