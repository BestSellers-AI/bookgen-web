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
import {
  getBackMatterSystemPrompt,
  buildBackMatterUserPrompt,
  type BackMatterSection,
} from '../prompts/back-matter.prompts';
import { getPromptLanguage, calculateTopicMinWords } from '../prompts/utils';

export interface GenerationJobData {
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
    topics: Array<{ title: string; content: string }>;
  }>;
  queuePriority?: number;
}

@Processor('generation', { concurrency: 1 })
export class BookGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(BookGenerationProcessor.name);

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
    this.logger.log(`Processing book generation for book ${job.data.bookId}`);
  }

  async process(job: Job<GenerationJobData>): Promise<void> {
    if (job.name !== 'generate-book') return;

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

      // If we have completed chapters but no context, rebuild from contextSummary
      if (!accumulatedContext && completedChapters.length > 0) {
        accumulatedContext = completedChapters
          .filter((c) => c.contextSummary)
          .map((c) => c.contextSummary)
          .join(' ');
      }

      // Phase 1: Generate each chapter sequentially
      for (const chapter of chapters) {
        if (completedSequences.has(chapter.sequence)) {
          this.logger.log(
            `Skipping already generated chapter ${chapter.sequence} for book ${bookId}`,
          );
          continue;
        }

        await job.updateProgress(
          Math.round((chapter.sequence / chapters.length) * 80),
        );

        const topics = chapter.topics || [];
        const topicMinWords = calculateTopicMinWords(pageTarget, chapterCount, topics.length || 2);
        const chapterSummary = topics.map((t) => `${t.title}: ${t.content}`).join('\n');

        // Generate all topics sequentially (each builds on previous context)
        const generatedTopics: Array<{ title: string; content: string }> = [];
        let chapterContext = '';

        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i];
          const topicNumber = i + 1;

          const topicContent = await this.generateTopic({
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

          generatedTopics.push({
            title: topic?.title || `Topic ${topicNumber}`,
            content: topicContent,
          });
          chapterContext += (chapterContext ? ' ' : '') + contextSummary;
        }

        accumulatedContext += (accumulatedContext ? ' ' : '') + chapterContext;

        // Save chapter result via hooks
        await this.hooksService.processChapterResult({
          bookId,
          chapterSequence: chapter.sequence,
          status: 'success',
          title: chapter.title,
          content: '',
          topics: generatedTopics,
          contextSummary: chapterContext,
        });

        // Persist context for resilience
        await this.prisma.book.update({
          where: { id: bookId },
          data: { context: accumulatedContext },
        });

        this.logger.log(
          `Chapter ${chapter.sequence}/${chapters.length} completed for book ${bookId}`,
        );
      }

      // Phase 2: Fetch all chapters for back matter context
      const allChapters = await this.prisma.chapter.findMany({
        where: { bookId },
        orderBy: { sequence: 'asc' },
        select: { title: true, topics: true, content: true },
      });
      const chaptersContext = JSON.stringify(
        allChapters.map((c) => ({ title: c.title, topics: c.topics })),
      );

      // Phase 3: Generate back matter (parallelized in batches)
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

      // Phase 4: Complete generation via hooks
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
