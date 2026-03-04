import { AddonStatus, ChapterStatus } from '../enums';

export interface AudiobookChapterItem {
  id: string;
  chapterId: string;
  sequence: number;
  title: string;
  audioUrl: string | null;
  durationSecs: number | null;
  status: ChapterStatus;
  createdAt: string;
}

export interface AudiobookSummary {
  id: string;
  bookId: string;
  voiceId: string | null;
  voiceName: string | null;
  status: AddonStatus;
  totalDuration: number | null;
  fullAudioUrl: string | null;
  fullAudioSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AudiobookDetail extends AudiobookSummary {
  chapters: AudiobookChapterItem[];
}
