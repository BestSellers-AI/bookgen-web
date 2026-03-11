import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LlmService } from '../../llm/llm.service';
import { HooksService } from '../../hooks/hooks.service';
import { AppConfigService } from '../../config/app-config.service';
import {
  getPreviewCompleteSystemPrompt,
  buildPreviewCompleteUserPrompt,
  PREVIEW_COMPLETE_OUTPUT_SCHEMA,
} from '../prompts/preview-complete.prompts';

export interface PreviewCompleteJobData {
  bookId: string;
  briefing: string;
  author: string;
  title: string;
  subtitle: string | null;
  creationMode: string;
  settings: Record<string, unknown> | null;
  planning: unknown;
  chapters: Array<{
    id: string;
    sequence: number;
    title: string;
    topics: unknown;
  }>;
}

interface PreviewCompleteResult {
  planning: {
    chapters: Array<{
      title: string;
      topics: Array<{ title: string; content: string }>;
    }>;
  };
  introduction: string;
  conclusion: string;
  finalConsiderations: string;
  glossary: string;
  appendix: string;
  closure: string;
}

@Processor('generation', { concurrency: 1 })
export class PreviewCompleteProcessor extends WorkerHost {
  private readonly logger = new Logger(PreviewCompleteProcessor.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly hooksService: HooksService,
    private readonly config: AppConfigService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing preview-complete for book ${job.data.bookId}`);
  }

  async process(job: Job<PreviewCompleteJobData>): Promise<void> {
    if (job.name !== 'preview-complete') return;

    const { bookId, briefing, author, title, subtitle, planning, settings } = job.data;

    try {
      const result = await this.llmService.chatCompletionJson<PreviewCompleteResult>({
        model: this.config.llmModelPreview,
        systemPrompt: getPreviewCompleteSystemPrompt(settings),
        userPrompt: buildPreviewCompleteUserPrompt({
          briefing,
          author,
          title,
          subtitle,
          planning,
          settings,
        }),
        schema: PREVIEW_COMPLETE_OUTPUT_SCHEMA,
        schemaName: 'preview_complete',
      });

      await this.hooksService.processPreviewCompleteResult({
        bookId,
        status: 'success',
        planning: result.planning,
        introduction: result.introduction,
        conclusion: result.conclusion,
        finalConsiderations: result.finalConsiderations,
        glossary: result.glossary,
        appendix: result.appendix,
        closure: result.closure,
      });

      this.logger.log(`Preview-complete completed for book ${bookId}`);
    } catch (error) {
      this.logger.error(
        `Preview-complete failed for book ${bookId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.hooksService.processPreviewCompleteResult({
        bookId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown preview-complete error',
      });

      throw error;
    }
  }
}
