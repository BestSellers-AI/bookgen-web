import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LlmService } from '../../llm/llm.service';
import { HooksService } from '../../hooks/hooks.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChapterStatus, type ProductKind } from '@prisma/client';
import {
  getGuidedPreviewSystemPrompt,
  getSimplePreviewSystemPrompt,
  buildPreviewUserPrompt,
  PREVIEW_OUTPUT_SCHEMA,
} from '../prompts/preview.prompts';
import {
  getPreviewCompleteSystemPrompt,
  buildPreviewCompleteUserPrompt,
  PREVIEW_COMPLETE_OUTPUT_SCHEMA,
} from '../prompts/preview-complete.prompts';
import { getChapterSystemPrompt, buildChapterUserPrompt } from '../prompts/chapter.prompts';
import { getContextSystemPrompt, buildContextUserPrompt } from '../prompts/context.prompts';
import {
  getBackMatterSystemPrompt,
  buildBackMatterUserPrompt,
  type BackMatterSection,
} from '../prompts/back-matter.prompts';
import {
  capitalizeTitle,
  getPromptLanguage,
  calculateTopicMinWords,
} from '../prompts/utils';
import type { PreviewJobData } from './preview.processor';
import type { PreviewCompleteJobData } from './preview-complete.processor';
import type { GenerationJobData } from './book-generation.processor';
import type { ChapterRegenJobData } from './chapter-regen.processor';

export interface AddonJobData {
  bookId: string;
  addonId: string;
  addonKind: ProductKind;
  params?: Record<string, unknown>;
}

const MOCK_ADDON_RESULT_URL =
  'https://m.media-amazon.com/images/G/01/Prelogin/img_about_hero_quotes.png';

const MOCK_ADDON_VARIATIONS = [
  { url: 'https://m.media-amazon.com/images/G/01/Prelogin/img_about_hero_quotes.png', label: 'Dark theme' },
  { url: 'https://m.media-amazon.com/images/G/01/Prelogin/img_about_hero_quotes.png', label: 'Light theme' },
];

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

const MIN_TOPIC_WORDS = 50;

@Processor('generation', {
  stalledInterval: 60_000,
  maxStalledCount: 2,
})
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly hooksService: HooksService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`[${job.name}] Processing for book ${job.data.bookId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[${job.name}] Failed for book ${job.data.bookId}: ${error.message}`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} stalled — will be retried by BullMQ`);
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'preview':
        return this.processPreview(job as Job<PreviewJobData>);
      case 'preview-complete':
        return this.processPreviewComplete(job as Job<PreviewCompleteJobData>);
      case 'generate-book':
        return this.processBookGeneration(job as Job<GenerationJobData>);
      case 'chapter-regen':
        return this.processChapterRegen(job as Job<ChapterRegenJobData>);
      case 'addon':
        return this.processAddon(job as Job<AddonJobData>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // ─── Preview ──────────────────────────────────────────────────────────

  private async processPreview(job: Job<PreviewJobData>): Promise<void> {
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

      // Validate preview has actual content
      if (!result.planning?.chapters?.length) {
        throw new Error('Preview returned empty planning (no chapters)');
      }
      if (!result.title?.trim()) {
        throw new Error('Preview returned empty title');
      }

      await this.hooksService.processPreviewResult({
        bookId,
        status: 'success',
        title: capitalizeTitle(result.title),
        subtitle: capitalizeTitle(result.subtitle),
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

  // ─── Preview Complete ─────────────────────────────────────────────────

  private async processPreviewComplete(job: Job<PreviewCompleteJobData>): Promise<void> {
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

  // ─── Book Generation ──────────────────────────────────────────────────

  private async processBookGeneration(job: Job<GenerationJobData>): Promise<void> {
    const { bookId, title, author, settings, planning, chapters } = job.data;
    const language = getPromptLanguage(settings as { language?: string });
    const pageTarget = (settings?.pageTarget as number) || 150;
    const chapterCount = chapters.length;
    const planJson = JSON.stringify(planning);

    try {
      // Check which chapters are already generated (resumable)
      const completedChapters = await this.prisma.chapter.findMany({
        where: { bookId, status: ChapterStatus.GENERATED },
        select: { sequence: true, contextSummary: true },
      });
      const completedSequences = new Set(completedChapters.map((c) => c.sequence));

      // Rebuild accumulated context from DB
      let accumulatedContext =
        (await this.prisma.book.findUnique({ where: { id: bookId }, select: { context: true } }))
          ?.context || '';

      if (!accumulatedContext && completedChapters.length > 0) {
        accumulatedContext = completedChapters
          .filter((c) => c.contextSummary)
          .map((c) => c.contextSummary)
          .join(' ');
      }

      // Phase 1: Generate each chapter sequentially
      for (const chapter of chapters) {
        if (completedSequences.has(chapter.sequence)) {
          this.logger.log(`Skipping already generated chapter ${chapter.sequence} for book ${bookId}`);
          continue;
        }

        await job.updateProgress(Math.round((chapter.sequence / chapters.length) * 80));

        const topics = chapter.topics || [];
        const topicMinWords = calculateTopicMinWords(pageTarget, chapterCount, topics.length || 2);
        const chapterSummary = topics.map((t) => `${t.title}: ${t.content}`).join('\n');

        const generatedTopics: Array<{ title: string; content: string }> = [];
        let chapterContext = '';

        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i];
          const topicNumber = i + 1;

          const topicContent = await this.generateTopicWithRetry({
            planJson,
            chapterNumber: chapter.sequence,
            chapterTitle: chapter.title,
            topicNumber,
            topicTitle: topic?.title || `Topic ${topicNumber}`,
            plannedTopicContent: topic?.content || '',
            chapterSummary,
            previousContext: accumulatedContext + (chapterContext ? ' ' + chapterContext : ''),
            language,
            topicTotalWords: topicMinWords,
            settings,
          });

          const contextSummary = await this.generateContextSummary({
            chapterNumber: chapter.sequence,
            chapterTitle: chapter.title,
            topicNumber,
            topicContent,
            previousContext: accumulatedContext + (chapterContext ? ' ' + chapterContext : ''),
            settings,
          });

          generatedTopics.push({ title: topic?.title || `Topic ${topicNumber}`, content: topicContent });
          chapterContext += (chapterContext ? ' ' : '') + contextSummary;
        }

        accumulatedContext += (accumulatedContext ? ' ' : '') + chapterContext;

        // Validate chapter has actual content before saving
        const totalWords = generatedTopics.reduce(
          (sum, t) => sum + t.content.split(/\s+/).filter(Boolean).length, 0,
        );
        if (totalWords < MIN_TOPIC_WORDS) {
          throw new Error(
            `Chapter ${chapter.sequence} generated with only ${totalWords} words (min: ${MIN_TOPIC_WORDS}). Possible LLM failure.`,
          );
        }

        await this.hooksService.processChapterResult({
          bookId,
          chapterSequence: chapter.sequence,
          status: 'success',
          title: chapter.title,
          content: '',
          topics: generatedTopics,
          contextSummary: chapterContext,
        });

        await this.prisma.book.update({
          where: { id: bookId },
          data: { context: accumulatedContext },
        });

        this.logger.log(`Chapter ${chapter.sequence}/${chapters.length} completed for book ${bookId}`);
      }

      // Phase 2: Fetch all chapters for back matter context
      const allChapters = await this.prisma.chapter.findMany({
        where: { bookId },
        orderBy: { sequence: 'asc' },
        select: { title: true, topics: true },
      });
      const chaptersContext = JSON.stringify(allChapters.map((c) => ({ title: c.title, topics: c.topics })));

      // Phase 3: Generate back matter (parallelized)
      await job.updateProgress(85);

      const [introduction, conclusion] = await Promise.all([
        this.generateBackMatterSection('introduction', chaptersContext, title, author, settings),
        this.generateBackMatterSection('conclusion', chaptersContext, title, author, settings),
      ]);

      await job.updateProgress(90);

      const [finalConsiderations, resourcesReferences] = await Promise.all([
        this.generateBackMatterSection('finalConsiderations', chaptersContext, title, author, settings),
        this.generateBackMatterSection('resourcesReferences', chaptersContext, title, author, settings),
      ]);

      await job.updateProgress(95);

      const [appendix, glossary, closure] = await Promise.all([
        this.generateBackMatterSection('appendix', chaptersContext, title, author, settings),
        this.generateBackMatterSection('glossary', chaptersContext, title, author, settings),
        this.generateBackMatterSection('closure', chaptersContext, title, author, settings),
      ]);

      await job.updateProgress(100);

      await this.hooksService.processGenerationComplete({
        bookId,
        introduction,
        conclusion,
        finalConsiderations,
        resourcesReferences,
        appendix,
        glossary,
        closure,
      });

      this.logger.log(`Book generation completed for book ${bookId}`);
    } catch (error) {
      this.logger.error(
        `Book generation failed for book ${bookId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.hooksService.processGenerationError({
        bookId,
        error: error instanceof Error ? error.message : 'Unknown generation error',
      });

      throw error;
    }
  }

  // ─── Chapter Regen ────────────────────────────────────────────────────

  private async processChapterRegen(job: Job<ChapterRegenJobData>): Promise<void> {
    const { bookId, chapterSequence, chapterTitle, chapterTopics, bookSettings, bookPlanning } = job.data;

    const settings = bookSettings;
    const language = getPromptLanguage(settings as { language?: string });
    const pageTarget = (settings?.pageTarget as number) || 150;
    const planningObj = bookPlanning as { chapters?: unknown[] } | null;
    const chapterCount = planningObj?.chapters?.length || 10;
    const planJson = JSON.stringify(bookPlanning);

    try {
      const previousChapters = await this.prisma.chapter.findMany({
        where: { bookId, sequence: { lt: chapterSequence }, status: ChapterStatus.GENERATED },
        orderBy: { sequence: 'asc' },
        select: { contextSummary: true },
      });

      const previousContext = previousChapters
        .filter((c) => c.contextSummary)
        .map((c) => c.contextSummary)
        .join(' ');

      const topics = chapterTopics || [];
      const topicMinWords = calculateTopicMinWords(pageTarget, chapterCount, topics.length || 2);
      const chapterSummary = topics.map((t) => `${t.title}: ${t.content}`).join('\n');

      const generatedTopics: Array<{ title: string; content: string }> = [];
      let chapterContext = '';

      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const topicNumber = i + 1;

        const topicContent = await this.generateTopicWithRetry({
          planJson,
          chapterNumber: chapterSequence,
          chapterTitle,
          topicNumber,
          topicTitle: topic?.title || `Topic ${topicNumber}`,
          plannedTopicContent: topic?.content || '',
          chapterSummary,
          previousContext: previousContext + (chapterContext ? ' ' + chapterContext : ''),
          language,
          topicTotalWords: topicMinWords,
          settings,
        });

        const contextSummary = await this.generateContextSummary({
          chapterNumber: chapterSequence,
          chapterTitle,
          topicNumber,
          topicContent,
          previousContext: previousContext + (chapterContext ? ' ' + chapterContext : ''),
          settings,
        });

        generatedTopics.push({ title: topic?.title || `Topic ${topicNumber}`, content: topicContent });
        chapterContext += (chapterContext ? ' ' : '') + contextSummary;
      }

      // Validate chapter has actual content
      const totalWords = generatedTopics.reduce(
        (sum, t) => sum + t.content.split(/\s+/).filter(Boolean).length, 0,
      );
      if (totalWords < MIN_TOPIC_WORDS) {
        throw new Error(
          `Chapter ${chapterSequence} regen produced only ${totalWords} words (min: ${MIN_TOPIC_WORDS}). Possible LLM failure.`,
        );
      }

      await this.hooksService.processChapterResult({
        bookId,
        chapterSequence,
        status: 'success',
        title: chapterTitle,
        content: '',
        topics: generatedTopics,
        contextSummary: chapterContext,
      });

      this.logger.log(`Chapter ${chapterSequence} regeneration completed for book ${bookId}`);
    } catch (error) {
      this.logger.error(
        `Chapter regen failed for book ${bookId}, chapter ${chapterSequence}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.prisma.chapter.updateMany({
        where: { bookId, sequence: chapterSequence },
        data: { status: ChapterStatus.ERROR },
      });

      throw error;
    }
  }

  // ─── Addon (mock) ────────────────────────────────────────────────────

  private async processAddon(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind } = job.data;

    try {
      // Simulate processing delay (1-2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.hooksService.processAddonResult({
        bookId,
        addonId,
        addonKind,
        status: 'success',
        resultUrl: MOCK_ADDON_RESULT_URL,
        resultData: { variations: MOCK_ADDON_VARIATIONS },
      });

      this.logger.log(`Mock addon ${addonKind} completed for book ${bookId}`);
    } catch (error) {
      this.logger.error(
        `Addon ${addonKind} failed for book ${bookId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.hooksService.processAddonResult({
        bookId,
        addonId,
        addonKind,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown addon error',
      });

      throw error;
    }
  }

  // ─── Shared helpers ───────────────────────────────────────────────────

  private async generateTopic(input: {
    planJson: string;
    chapterNumber: number;
    chapterTitle: string;
    topicNumber: number;
    topicTitle: string;
    plannedTopicContent: string;
    chapterSummary: string;
    previousContext: string;
    language: string;
    topicTotalWords: number;
    settings: Record<string, unknown> | null;
  }): Promise<string> {
    const result = await this.llmService.chatCompletion({
      model: this.config.llmModelGeneration,
      systemPrompt: getChapterSystemPrompt({
        settings: input.settings,
        topicTotalWords: input.topicTotalWords,
      }),
      userPrompt: buildChapterUserPrompt(input),
    });
    return result.content;
  }

  private async generateTopicWithRetry(
    input: Parameters<GenerationProcessor['generateTopic']>[0],
    maxAttempts = 2,
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const content = await this.generateTopic(input);
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      if (wordCount >= MIN_TOPIC_WORDS) {
        return content;
      }

      this.logger.warn(
        `Topic "${input.topicTitle}" (ch ${input.chapterNumber}) returned only ${wordCount} words on attempt ${attempt}/${maxAttempts}`,
      );

      if (attempt === maxAttempts) {
        if (wordCount > 0) {
          // Accept short content on final attempt rather than failing
          this.logger.warn(`Accepting short content for topic "${input.topicTitle}" after ${maxAttempts} attempts`);
          return content;
        }
        throw new Error(
          `Topic "${input.topicTitle}" (ch ${input.chapterNumber}) returned empty content after ${maxAttempts} attempts`,
        );
      }
    }

    // Unreachable but satisfies TS
    throw new Error('Unexpected: retry loop exited without return');
  }

  private async generateContextSummary(input: {
    chapterNumber: number;
    chapterTitle: string;
    topicNumber: number;
    topicContent: string;
    previousContext: string;
    settings: Record<string, unknown> | null;
  }): Promise<string> {
    const result = await this.llmService.chatCompletion({
      model: this.config.llmModelGeneration,
      systemPrompt: getContextSystemPrompt({
        settings: input.settings,
        contextFromWords: 600,
        contextToWords: 800,
      }),
      userPrompt: buildContextUserPrompt(input),
    });
    return result.content;
  }

  private async generateBackMatterSection(
    section: BackMatterSection,
    chaptersContext: string,
    bookTitle: string,
    bookAuthor: string,
    settings: Record<string, unknown> | null,
  ): Promise<string> {
    const result = await this.llmService.chatCompletion({
      model: this.config.llmModelGeneration,
      systemPrompt: getBackMatterSystemPrompt(section, settings),
      userPrompt: buildBackMatterUserPrompt(chaptersContext, bookTitle, bookAuthor),
    });
    return result.content;
  }
}
