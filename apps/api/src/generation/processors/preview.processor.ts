import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LlmService } from '../../llm/llm.service';
import { HooksService } from '../../hooks/hooks.service';
import { AppConfigService } from '../../config/app-config.service';
import {
  getGuidedPreviewSystemPrompt,
  getSimplePreviewSystemPrompt,
  buildPreviewUserPrompt,
  PREVIEW_OUTPUT_SCHEMA,
} from '../prompts/preview.prompts';
import { capitalizeTitle } from '../prompts/utils';

export interface PreviewJobData {
  bookId: string;
  briefing: string;
  author: string;
  title?: string | null;
  subtitle?: string | null;
  creationMode: string;
  settings: Record<string, unknown> | null;
}

interface PreviewResult {
  title: string;
  subtitle: string;
  planning: {
    chapters: Array<{
      title: string;
      topics: Array<{ title: string; content: string }>;
    }>;
  };
}

@Processor('generation', { concurrency: 1 })
export class PreviewProcessor extends WorkerHost {
  private readonly logger = new Logger(PreviewProcessor.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly hooksService: HooksService,
    private readonly config: AppConfigService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing preview for book ${job.data.bookId}`);
  }

  async process(job: Job<PreviewJobData>): Promise<void> {
    if (job.name !== 'preview') return;

    const { bookId, briefing, author, title, subtitle, creationMode, settings } = job.data;

    try {
      const systemPrompt =
        creationMode === 'GUIDED'
          ? getGuidedPreviewSystemPrompt({ settings })
          : getSimplePreviewSystemPrompt({ settings });

      const userPrompt = buildPreviewUserPrompt(creationMode, {
        briefing,
        author,
        title,
        subtitle,
      });

      const result = await this.llmService.chatCompletionJson<PreviewResult>({
        model: this.config.llmModelPreview,
        systemPrompt,
        userPrompt,
        schema: PREVIEW_OUTPUT_SCHEMA,
        schemaName: 'preview_structure',
      });

      const capitalizedTitle = capitalizeTitle(result.title);
      const capitalizedSubtitle = capitalizeTitle(result.subtitle);

      await this.hooksService.processPreviewResult({
        bookId,
        status: 'success',
        title: capitalizedTitle,
        subtitle: capitalizedSubtitle,
        author: capitalizeTitle(author),
        planning: result.planning,
      });

      this.logger.log(`Preview completed for book ${bookId}`);
    } catch (error) {
      this.logger.error(
        `Preview failed for book ${bookId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.hooksService.processPreviewResult({
        bookId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown preview error',
      });

      throw error;
    }
  }
}
