import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LlmService } from '../../llm/llm.service';
import { HooksService } from '../../hooks/hooks.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChapterStatus } from '@prisma/client';
import { getChapterSystemPrompt, buildChapterUserPrompt } from '../prompts/chapter.prompts';
import { getContextSystemPrompt, buildContextUserPrompt } from '../prompts/context.prompts';
import { getPromptLanguage, calculateTopicMinWords } from '../prompts/utils';

export interface ChapterRegenJobData {
  bookId: string;
  chapterId: string;
  chapterSequence: number;
  chapterTitle: string;
  chapterTopics: Array<{ title: string; content: string }>;
  bookTitle: string;
  bookAuthor: string;
  bookBriefing: string;
  bookSettings: Record<string, unknown> | null;
  bookPlanning: unknown;
}

@Processor('generation', { concurrency: 1 })
export class ChapterRegenProcessor extends WorkerHost {
  private readonly logger = new Logger(ChapterRegenProcessor.name);

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
    this.logger.log(
      `Processing chapter regen for book ${job.data.bookId}, chapter ${job.data.chapterSequence}`,
    );
  }

  async process(job: Job<ChapterRegenJobData>): Promise<void> {
    if (job.name !== 'chapter-regen') return;

    const {
      bookId,
      chapterSequence,
      chapterTitle,
      chapterTopics,
      bookSettings,
      bookPlanning,
    } = job.data;

    const settings = bookSettings;
    const language = getPromptLanguage(settings as { language?: string });
    const pageTarget = (settings?.pageTarget as number) || 150;

    // Get chapter count from planning
    const planningObj = bookPlanning as { chapters?: unknown[] } | null;
    const chapterCount = planningObj?.chapters?.length || 10;
    const planJson = JSON.stringify(bookPlanning);

    try {
      // Rebuild context from previous chapters
      const previousChapters = await this.prisma.chapter.findMany({
        where: {
          bookId,
          sequence: { lt: chapterSequence },
          status: ChapterStatus.GENERATED,
        },
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

      // Generate all topics sequentially
      const generatedTopics: Array<{ title: string; content: string }> = [];
      let chapterContext = '';

      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const topicNumber = i + 1;

        const topicContent = await this.generateTopic({
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

        generatedTopics.push({
          title: topic?.title || `Topic ${topicNumber}`,
          content: topicContent,
        });
        chapterContext += (chapterContext ? ' ' : '') + contextSummary;
      }

      // Save via hooks
      await this.hooksService.processChapterResult({
        bookId,
        chapterSequence,
        status: 'success',
        title: chapterTitle,
        content: '',
        topics: generatedTopics,
        contextSummary: chapterContext,
      });

      this.logger.log(
        `Chapter ${chapterSequence} regeneration completed for book ${bookId}`,
      );
    } catch (error) {
      this.logger.error(
        `Chapter regen failed for book ${bookId}, chapter ${chapterSequence}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Mark chapter as error
      await this.prisma.chapter.updateMany({
        where: { bookId, sequence: chapterSequence },
        data: { status: ChapterStatus.ERROR },
      });

      throw error;
    }
  }

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
}
