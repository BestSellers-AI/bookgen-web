export interface BookImageItem {
  id: string;
  bookId: string;
  chapterId: string | null;
  prompt: string;
  imageUrl: string;
  caption: string | null;
  position: number;
  createdAt: string;
}

export interface ImageGenerationConfig {
  chapterIds?: string[];
  count?: number;
  style?: string;
}
