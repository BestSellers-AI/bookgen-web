import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { PreviewJobData } from './processors/preview.processor';
import type { PreviewCompleteJobData } from './processors/preview-complete.processor';
import type { GenerationJobData } from './processors/book-generation.processor';
import type { ChapterRegenJobData } from './processors/chapter-regen.processor';
import type { AddonJobData } from './processors/generation.processor';

const DEFAULT_JOB_OPTIONS = {
  attempts: 2,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: 100,
  removeOnFail: 50,
};

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(@InjectQueue('generation') private readonly queue: Queue) {}

  async addPreviewJob(bookId: string, data: Omit<PreviewJobData, 'bookId'>, priority = 10) {
    this.logger.log(`Adding preview job for book ${bookId} (priority: ${priority})`);

    return this.queue.add(
      'preview',
      { bookId, ...data },
      {
        ...DEFAULT_JOB_OPTIONS,
        priority,
        jobId: `preview-${bookId}-${Date.now()}`,
      },
    );
  }

  async addPreviewCompleteJob(
    bookId: string,
    data: Omit<PreviewCompleteJobData, 'bookId'>,
    priority = 10,
  ) {
    this.logger.log(`Adding preview-complete job for book ${bookId} (priority: ${priority})`);

    return this.queue.add(
      'preview-complete',
      { bookId, ...data },
      {
        ...DEFAULT_JOB_OPTIONS,
        priority,
        jobId: `preview-complete-${bookId}-${Date.now()}`,
      },
    );
  }

  async addGenerationJob(
    bookId: string,
    data: Omit<GenerationJobData, 'bookId'>,
    priority = 10,
  ) {
    this.logger.log(`Adding generate-book job for book ${bookId} (priority: ${priority})`);

    return this.queue.add(
      'generate-book',
      { bookId, ...data },
      {
        ...DEFAULT_JOB_OPTIONS,
        priority,
        jobId: `generate-book-${bookId}-${Date.now()}`,
      },
    );
  }

  async addChapterRegenJob(
    bookId: string,
    data: Omit<ChapterRegenJobData, 'bookId'>,
    priority = 10,
  ) {
    this.logger.log(
      `Adding chapter-regen job for book ${bookId}, chapter ${data.chapterSequence} (priority: ${priority})`,
    );

    return this.queue.add(
      'chapter-regen',
      { bookId, ...data },
      {
        ...DEFAULT_JOB_OPTIONS,
        priority,
        jobId: `chapter-regen-${bookId}-${data.chapterSequence}-${Date.now()}`,
      },
    );
  }

  async addAddonJob(
    bookId: string,
    data: Omit<AddonJobData, 'bookId'>,
    priority = 10,
  ) {
    this.logger.log(
      `Adding addon job for book ${bookId}, addon ${data.addonId} (${data.addonKind})`,
    );

    return this.queue.add(
      'addon',
      { bookId, ...data },
      {
        ...DEFAULT_JOB_OPTIONS,
        priority,
        jobId: `addon-${data.addonId}-${Date.now()}`,
      },
    );
  }
}
