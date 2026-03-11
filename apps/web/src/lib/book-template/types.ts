export interface RenderableChapter {
  sequence: number;
  title: string;
  content: string; // full chapter text (may contain topic headings)
  imageUrl?: string | null;
}

export interface RenderableBook {
  title: string;
  subtitle?: string | null;
  author: string;
  coverUrl?: string | null;
  introduction?: string | null;
  chapters: RenderableChapter[];
  conclusion?: string | null;
  finalConsiderations?: string | null;
  glossary?: string | null;
  appendix?: string | null;
  closure?: string | null;
  wordCount: number;
  language?: string | null;
}
