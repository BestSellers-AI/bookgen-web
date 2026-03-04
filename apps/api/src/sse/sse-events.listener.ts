import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SseManager } from './sse-manager';

@Injectable()
export class SseEventsListener {
  constructor(private readonly sseManager: SseManager) {}

  @OnEvent('book.preview.progress')
  handlePreviewProgress(payload: {
    bookId: string;
    status: string;
    error?: string;
  }) {
    this.sseManager.emit(payload.bookId, {
      type: 'preview_progress',
      data: payload,
    });

    // Complete the stream on terminal states
    if (payload.status === 'ready' || payload.status === 'error') {
      this.sseManager.complete(payload.bookId);
    }
  }

  @OnEvent('book.generation.progress')
  handleGenerationProgress(payload: {
    bookId: string;
    status: string;
    chaptersCompleted?: number;
    totalChapters?: number;
    currentChapter?: number;
    error?: string;
  }) {
    this.sseManager.emit(payload.bookId, {
      type: 'generation_progress',
      data: payload,
    });

    // Complete on terminal states
    if (payload.status === 'complete' || payload.status === 'error') {
      this.sseManager.complete(payload.bookId);
    }
  }

  @OnEvent('book.addon.progress')
  handleAddonProgress(payload: {
    bookId: string;
    addonId: string;
    status: string;
    error?: string;
  }) {
    this.sseManager.emit(payload.bookId, {
      type: 'addon_progress',
      data: payload,
    });
  }
}
