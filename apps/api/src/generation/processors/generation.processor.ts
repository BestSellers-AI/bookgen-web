import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LlmService } from '../../llm/llm.service';
import { HooksService } from '../../hooks/hooks.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChapterStatus, ProductKind } from '@prisma/client';
import { StorageService } from '../../storage/storage.service';
import { TranslationService } from '../../translations/translation.service';
import { TtsService, type VoiceGender } from '../../tts/tts.service';
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
  getCoverConceptSystemPrompt,
  buildCoverConceptUserPrompt,
  buildImageGenerationPrompt,
  COVER_CONCEPTS_SCHEMA,
} from '../prompts/cover.prompts';
import {
  getChapterImagesSystemPrompt,
  buildChapterImagesUserPrompt,
  buildChapterImageGenerationPrompt,
  CHAPTER_IMAGES_SCHEMA,
} from '../prompts/chapter-images.prompts';
import {
  getTranslationSystemPrompt,
  buildChapterTranslationUserPrompt,
  buildBackMatterTranslationUserPrompt,
  buildTitleTranslationUserPrompt,
  CHAPTER_TRANSLATION_SCHEMA,
  TITLE_TRANSLATION_SCHEMA,
} from '../prompts/translation.prompts';
import { buildCoverTranslationPrompt } from '../prompts/cover-translation.prompts';
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

const COVER_STYLE_LABELS = [
  'Minimalist',
  'Abstract',
  'Cinematic',
  'Editorial',
  'Illustrated',
  'Bold Graphic',
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
  stalledInterval: 300_000, // 5 min — LLM calls can take 1-3 min each
  lockDuration: 600_000, // 10 min — image gen can take 3min × 3 retries per batch
  maxStalledCount: 2,
  concurrency: 2,
})
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly hooksService: HooksService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
    private readonly translationService: TranslationService,
    private readonly ttsService: TtsService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`[${job.name}] Processing for book ${job.data.bookId}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error | undefined) {
    const bookId = job.data?.bookId;
    const errorMessage = error?.message ?? 'Unknown error';
    this.logger.error(`[${job.name}] Failed for book ${bookId}: ${errorMessage}`);

    if (!bookId) return;

    const maxAttempts = (job.opts?.attempts ?? 3);
    const isFinalFailure = job.attemptsMade >= maxAttempts || errorMessage.includes('stalled');

    if (!isFinalFailure) return;

    try {
      if (job.name === 'addon') {
        const addonId = job.data?.addonId;
        const addonKind = job.data?.addonKind;
        if (addonId) {
          await this.hooksService.processAddonResult({
            bookId,
            addonId,
            addonKind,
            status: 'error',
            error: `Add-on failed: ${errorMessage}`,
          });
        }
      } else {
        await this.hooksService.processGenerationError({
          bookId,
          error: `Generation failed: ${errorMessage}`,
        });
      }
    } catch (hookError) {
      this.logger.error(`Failed to handle final failure for book ${bookId}: ${hookError}`);

      // Last-resort fallback: directly mark addon as ERROR in DB
      if (job.name === 'addon' && job.data?.addonId) {
        await this.prisma.bookAddon.updateMany({
          where: { id: job.data.addonId, status: { notIn: ['COMPLETED', 'ERROR', 'CANCELLED'] } },
          data: { status: 'ERROR', error: `Job failed: ${errorMessage}` },
        }).catch((dbErr) => {
          this.logger.error(`Last-resort addon status update also failed for ${job.data.addonId}: ${dbErr}`);
        });
      }
    }
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

        // Mark chapter as generating in DB + notify frontend via SSE
        await this.prisma.chapter.updateMany({
          where: { bookId, sequence: chapter.sequence, status: ChapterStatus.PENDING },
          data: { status: ChapterStatus.GENERATING },
        });
        this.eventEmitter.emit('book.generation.progress', {
          bookId,
          status: 'generating',
          currentChapter: chapter.sequence,
          totalChapters: chapters.length,
        });

        const topics = chapter.topics || [];
        const topicMinWords = calculateTopicMinWords(pageTarget, chapterCount, topics.length || 2);
        const chapterSummary = topics.map((t) => `${t.title}: ${t.content}`).join('\n');

        const generatedTopics: Array<{ title: string; content: string }> = [];
        let chapterContext = '';

        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i];
          const topicNumber = i + 1;

          // Keep-alive: update progress before each LLM call to prevent stalled detection
          const topicProgress = Math.round(
            ((chapter.sequence - 1 + (i / topics.length)) / chapters.length) * 80,
          );
          await job.updateProgress(topicProgress);

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

          await job.updateProgress(topicProgress + 1); // heartbeat after topic generation

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

        await job.updateProgress(Math.round((i / topics.length) * 80));

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

        await job.updateProgress(Math.round(((i + 0.5) / topics.length) * 80));

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

  // ─── Addon ──────────────────────────────────────────────────────────

  private async processAddon(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind, params } = job.data;

    try {
      if (addonKind === ProductKind.ADDON_COVER) {
        await this.processAddonCover(job);
      } else if (addonKind === ProductKind.ADDON_IMAGES) {
        await this.processAddonImages(job);
      } else if (addonKind === ProductKind.ADDON_TRANSLATION) {
        await this.processAddonTranslation(job);
      } else if (addonKind === ProductKind.ADDON_COVER_TRANSLATION) {
        await this.processAddonCoverTranslation(job);
      } else if (addonKind === ProductKind.ADDON_AUDIOBOOK) {
        await this.processAddonAudiobook(job);
      } else {
        // Other addon types not yet implemented — mock result
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await this.hooksService.processAddonResult({
          bookId,
          addonId,
          addonKind,
          status: 'success',
          resultUrl: '',
          resultData: { mock: true },
        });
        this.logger.log(`Mock addon ${addonKind} completed for book ${bookId}`);
      }
    } catch (error) {
      this.logger.error(
        `Addon ${addonKind} failed for book ${bookId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      try {
        await this.hooksService.processAddonResult({
          bookId,
          addonId,
          addonKind,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown addon error',
        });
      } catch (hookError) {
        this.logger.error(`Failed to process addon error result for ${addonId}: ${hookError}`);
      }

      throw error;
    }
  }

  // ─── Cover Generation ──────────────────────────────────────────────

  private async processAddonCover(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind, params } = job.data;
    const bookContext = (params?.bookContext ?? {}) as Record<string, unknown>;

    const title = (bookContext.title as string) || 'Untitled';
    const subtitle = (bookContext.subtitle as string) || '';
    const author = (bookContext.author as string) || '';
    const briefing = (bookContext.briefing as string) || '';
    const planning = bookContext.planning;
    const settings = (bookContext.settings as Record<string, unknown>) || null;

    // Step 1: Generate 6 cover concept prompts via LLM
    this.logger.log(`[cover] Generating 6 concept prompts for book ${bookId}`);
    await job.updateProgress(10);

    const conceptInput = { title, subtitle, author, briefing, planning, settings };

    const concepts = await this.llmService.chatCompletionJson<{
      concepts: Array<{ style: string; description: string; prompt: string }>;
    }>({
      model: this.config.llmModelPreview,
      systemPrompt: getCoverConceptSystemPrompt(conceptInput),
      userPrompt: buildCoverConceptUserPrompt(conceptInput),
      schema: COVER_CONCEPTS_SCHEMA,
      schemaName: 'cover_concepts',
      temperature: 0.9,
    });

    if (!concepts.concepts?.length) {
      throw new Error('LLM returned no cover concepts');
    }

    // Ensure exactly 6 concepts (pad or trim)
    const conceptList = concepts.concepts.slice(0, 6);
    while (conceptList.length < 6) {
      conceptList.push(conceptList[conceptList.length - 1]);
    }

    this.logger.log(`[cover] Got ${conceptList.length} concepts, generating images for book ${bookId}`);
    await job.updateProgress(20);

    // Step 2: Generate images in parallel (batches of 2 to avoid rate limits)
    const batchTs = Date.now();
    const variations: Array<{ url: string; fileName: string; label: string }> = [];

    for (let batch = 0; batch < 3; batch++) {
      const batchStart = batch * 2;
      const batchConcepts = conceptList.slice(batchStart, batchStart + 2);

      const imageResults = await Promise.allSettled(
        batchConcepts.map(async (concept, indexInBatch) => {
          const index = batchStart + indexInBatch;
          const imagePrompt = buildImageGenerationPrompt(concept.prompt);

          const result = await this.llmService.generateImage({
            model: this.config.llmModelImage,
            prompt: imagePrompt,
            temperature: 0.8,
          });

          return { index, result, concept };
        }),
      );

      for (const settled of imageResults) {
        if (settled.status === 'fulfilled') {
          const { index, result, concept } = settled.value;

          // Step 3: Upload to S3
          const ext = result.mimeType.includes('png') ? 'png' : 'jpg';
          const key = `covers/${bookId}/${batchTs}-cover-${index + 1}.${ext}`;
          const buffer = Buffer.from(result.imageBase64, 'base64');

          const url = await this.storageService.upload(key, buffer, result.mimeType);

          const label = concept.style || COVER_STYLE_LABELS[index] || `Variation ${index + 1}`;
          variations.push({
            url,
            fileName: `cover-${index + 1}-${label.toLowerCase().replace(/\s+/g, '-')}.${ext}`,
            label,
          });

          this.logger.log(`[cover] Image ${index + 1}/6 uploaded for book ${bookId}`);
        } else {
          this.logger.warn(
            `[cover] Image generation failed for concept ${batchStart}: ${settled.reason}`,
          );
        }
      }

      await job.updateProgress(20 + ((batch + 1) / 3) * 70);
    }

    if (variations.length === 0) {
      throw new Error('All 6 cover image generations failed');
    }

    // Step 4: Save results
    await this.hooksService.processAddonResult({
      bookId,
      addonId,
      addonKind,
      status: 'success',
      resultUrl: variations[0].url,
      resultData: {
        variations: variations.map((v) => ({
          url: v.url,
          fileName: v.fileName,
          label: v.label,
        })),
      },
    });

    this.logger.log(
      `[cover] Cover generation completed for book ${bookId}: ${variations.length}/6 images`,
    );
  }

  // ─── Chapter Images Generation ──────────────────────────────────────

  private async processAddonImages(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind, params } = job.data;
    const bookContext = (params?.bookContext ?? {}) as Record<string, unknown>;

    const title = (bookContext.title as string) || 'Untitled';
    const subtitle = (bookContext.subtitle as string) || '';
    const briefing = (bookContext.briefing as string) || '';
    const planning = bookContext.planning;
    const chapters = (bookContext.chapters ?? []) as Array<{
      id: string;
      sequence: number;
      title: string;
    }>;

    if (chapters.length === 0) {
      throw new Error('No chapters found in book context for image generation');
    }

    // Step 1: Generate one image prompt per chapter via LLM
    this.logger.log(
      `[images] Generating ${chapters.length} chapter image prompts for book ${bookId}`,
    );
    await job.updateProgress(5);

    const conceptResult = await this.llmService.chatCompletionJson<{
      images: Array<{
        chapterSequence: number;
        chapterTitle: string;
        description: string;
        prompt: string;
      }>;
    }>({
      model: this.config.llmModelPreview,
      systemPrompt: getChapterImagesSystemPrompt(),
      userPrompt: buildChapterImagesUserPrompt({
        title,
        subtitle,
        briefing,
        chapters,
        planning,
      }),
      schema: CHAPTER_IMAGES_SCHEMA,
      schemaName: 'chapter_images',
      temperature: 0.9,
    });

    if (!conceptResult.images?.length) {
      throw new Error('LLM returned no chapter image concepts');
    }

    // Map concepts by sequence, pad missing chapters
    const conceptMap = new Map(
      conceptResult.images.map((img) => [img.chapterSequence, img]),
    );
    const orderedConcepts = chapters
      .sort((a, b) => a.sequence - b.sequence)
      .map((ch) => {
        const concept = conceptMap.get(ch.sequence);
        return {
          chapterId: ch.id,
          sequence: ch.sequence,
          title: ch.title,
          description: concept?.description || '',
          prompt: concept?.prompt || `Artistic illustration for a book chapter titled "${ch.title}"`,
        };
      });

    this.logger.log(
      `[images] Got ${conceptResult.images.length} concepts, generating images for book ${bookId}`,
    );
    await job.updateProgress(15);

    // Step 2: Generate images in batches of 2
    const generatedImages: Array<{
      chapterId: string;
      prompt: string;
      imageUrl: string;
      caption: string;
      position: number;
    }> = [];

    const totalChapters = orderedConcepts.length;
    const batchSize = 2;

    for (let batch = 0; batch < Math.ceil(totalChapters / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchConcepts = orderedConcepts.slice(batchStart, batchStart + batchSize);

      // Heartbeat before each batch to prevent stall/lock expiry
      await job.updateProgress(
        15 + Math.round((batch / Math.ceil(totalChapters / batchSize)) * 80),
      );

      const imageResults = await Promise.allSettled(
        batchConcepts.map(async (concept) => {
          const imagePrompt = buildChapterImageGenerationPrompt(
            concept.title,
            concept.prompt,
          );

          const result = await this.llmService.generateImage({
            model: this.config.llmModelImage,
            prompt: imagePrompt,
            temperature: 0.8,
          });

          return { concept, result };
        }),
      );

      for (const settled of imageResults) {
        if (settled.status === 'fulfilled') {
          const { concept, result } = settled.value;

          // Upload to S3 — unique key per generation to avoid overwriting previous batches
          const ext = result.mimeType.includes('png') ? 'png' : 'jpg';
          const key = `chapter-images/${bookId}/chapter-${concept.sequence}-${Date.now()}.${ext}`;
          const buffer = Buffer.from(result.imageBase64, 'base64');
          const url = await this.storageService.upload(key, buffer, result.mimeType);

          generatedImages.push({
            chapterId: concept.chapterId,
            prompt: concept.prompt,
            imageUrl: url,
            caption: concept.description,
            position: concept.sequence,
          });

          this.logger.log(
            `[images] Chapter ${concept.sequence}/${totalChapters} image uploaded for book ${bookId}`,
          );
        } else {
          const failedIndex = batchStart;
          this.logger.warn(
            `[images] Image generation failed for chapter ${failedIndex + 1}: ${settled.reason}`,
          );
        }
      }

      await job.updateProgress(
        15 + Math.round(((batch + 1) / Math.ceil(totalChapters / batchSize)) * 80),
      );
    }

    if (generatedImages.length === 0) {
      throw new Error('All chapter image generations failed');
    }

    // Step 3: Save results
    await this.hooksService.processAddonResult({
      bookId,
      addonId,
      addonKind,
      status: 'success',
      resultUrl: generatedImages[0].imageUrl,
      resultData: {
        images: generatedImages,
      },
    });

    this.logger.log(
      `[images] Chapter images completed for book ${bookId}: ${generatedImages.length}/${totalChapters} images`,
    );
  }

  // ─── Translation ────────────────────────────────────────────────────

  private async processAddonTranslation(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind, params } = job.data;
    const bookContext = (params?.bookContext ?? {}) as Record<string, unknown>;
    const targetLanguage = (params?.targetLanguage as string) || 'en';

    // Fetch full book data from DB
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: {
        title: true,
        subtitle: true,
        settings: true,
        introduction: true,
        conclusion: true,
        finalConsiderations: true,
        glossary: true,
        appendix: true,
        closure: true,
        chapters: {
          orderBy: { sequence: 'asc' as const },
          select: { id: true, sequence: true, title: true, content: true, topics: true },
        },
      },
    });

    if (!book) throw new Error(`Book ${bookId} not found`);

    const settings = book.settings as Record<string, unknown> | null;
    const sourceLanguage = (settings?.language as string) || 'en';
    const systemPrompt = getTranslationSystemPrompt(targetLanguage, sourceLanguage);

    // Step 1: Find existing or create BookTranslation + TranslationChapter records
    // Idempotency: if job is retried after crash, reuse the existing TRANSLATING translation
    let translation = await this.prisma.bookTranslation.findFirst({
      where: { bookId, targetLanguage, status: 'TRANSLATING' },
    });

    if (!translation) {
      translation = await this.prisma.bookTranslation.create({
        data: {
          bookId,
          targetLanguage,
          status: 'TRANSLATING',
          totalChapters: book.chapters.length,
          completedChapters: 0,
          chapters: {
            create: book.chapters.map((ch) => ({
              chapterId: ch.id,
              sequence: ch.sequence,
              status: 'PENDING',
            })),
          },
        },
      });
      this.logger.log(`[translation] Created translation ${translation.id} for book ${bookId} → ${targetLanguage}`);
    } else {
      this.logger.log(`[translation] Resuming translation ${translation.id} for book ${bookId} → ${targetLanguage}`);
    }

    await job.updateProgress(5);

    // Step 2: Translate title + subtitle (skip if already done on resume)
    if (!translation.translatedTitle) {
      const titleResult = await this.llmService.chatCompletionJson<{
        translatedTitle: string;
        translatedSubtitle: string;
      }>({
        model: this.config.llmModelGeneration,
        systemPrompt,
        userPrompt: buildTitleTranslationUserPrompt(book.title, book.subtitle, targetLanguage),
        schema: TITLE_TRANSLATION_SCHEMA,
        schemaName: 'title_translation',
      });

      await this.prisma.bookTranslation.update({
        where: { id: translation.id },
        data: {
          translatedTitle: titleResult.translatedTitle,
          translatedSubtitle: titleResult.translatedSubtitle || null,
        },
      });
    } else {
      this.logger.log(`[translation] Title already translated, skipping`);
    }

    await job.updateProgress(10);

    // Step 3: Translate back matter in parallel (skip if already done on resume)
    if (!translation.translatedIntroduction && !translation.translatedConclusion) {
      const backMatterSections: Array<{ field: string; content: string; label: string }> = [];
      if (book.introduction) backMatterSections.push({ field: 'translatedIntroduction', content: book.introduction, label: 'Introduction' });
      if (book.conclusion) backMatterSections.push({ field: 'translatedConclusion', content: book.conclusion, label: 'Conclusion' });
      if (book.finalConsiderations) backMatterSections.push({ field: 'translatedFinalConsiderations', content: book.finalConsiderations, label: 'Final Considerations' });
      if (book.glossary) {
        const glossaryText = typeof book.glossary === 'string' ? book.glossary : JSON.stringify(book.glossary);
        backMatterSections.push({ field: 'translatedGlossary', content: glossaryText, label: 'Glossary' });
      }
      if (book.appendix) backMatterSections.push({ field: 'translatedAppendix', content: book.appendix, label: 'Appendix' });
      if (book.closure) backMatterSections.push({ field: 'translatedClosure', content: book.closure, label: 'Closure' });

      if (backMatterSections.length > 0) {
        const backMatterResults = await Promise.all(
          backMatterSections.map(async (section) => {
            const result = await this.llmService.chatCompletion({
              model: this.config.llmModelGeneration,
              systemPrompt,
              userPrompt: buildBackMatterTranslationUserPrompt(section.label, section.content, targetLanguage),
            });
            return { field: section.field, content: result.content };
          }),
        );

        const updateData: Record<string, string> = {};
        for (const r of backMatterResults) {
          updateData[r.field] = r.content;
        }

        await this.prisma.bookTranslation.update({
          where: { id: translation.id },
          data: updateData,
        });
      }
    } else {
      this.logger.log(`[translation] Back matter already translated, skipping`);
    }

    await job.updateProgress(20);

    // Step 4: Translate chapters sequentially
    // Build set of already-translated chapter IDs for resumability
    const completedChapterIds = new Set(
      (await this.prisma.translationChapter.findMany({
        where: { translationId: translation.id, status: 'TRANSLATED' },
        select: { chapterId: true },
      })).map((c) => c.chapterId),
    );

    const totalChapters = book.chapters.length;

    for (let i = 0; i < book.chapters.length; i++) {
      const chapter = book.chapters[i];

      // Skip already translated chapters (resume after crash)
      if (completedChapterIds.has(chapter.id)) {
        this.logger.log(`[translation] Skipping already translated chapter ${chapter.sequence} for book ${bookId}`);
        continue;
      }

      // Heartbeat before LLM call
      const progressBefore = 20 + Math.round((i / totalChapters) * 75);
      await job.updateProgress(progressBefore);

      // Build chapter content from topics if flat content is not available
      let chapterContent = chapter.content || '';
      if (!chapterContent && chapter.topics) {
        const topics = chapter.topics as Array<{ title: string; content: string }>;
        chapterContent = topics.map((t) => `## ${t.title}\n\n${t.content}`).join('\n\n');
      }

      if (!chapterContent) {
        this.logger.warn(`[translation] Chapter ${chapter.sequence} has no content, skipping`);
        continue;
      }

      const chapterResult = await this.llmService.chatCompletionJson<{
        translatedTitle: string;
        translatedContent: string;
      }>({
        model: this.config.llmModelGeneration,
        systemPrompt,
        userPrompt: buildChapterTranslationUserPrompt(chapter.title, chapterContent, targetLanguage),
        schema: CHAPTER_TRANSLATION_SCHEMA,
        schemaName: 'chapter_translation',
      });

      // Heartbeat after LLM call
      await job.updateProgress(progressBefore + 1);

      // Save translated chapter (processChapterTranslation has its own idempotency guard)
      await this.translationService.processChapterTranslation(translation.id, {
        chapterId: chapter.id,
        translatedTitle: chapterResult.translatedTitle,
        translatedContent: chapterResult.translatedContent,
      });

      // Emit SSE progress
      this.eventEmitter.emit('book.addon.progress', {
        bookId,
        addonId,
        status: 'translating',
        currentChapter: i + 1,
        totalChapters,
      });

      this.logger.log(`[translation] Chapter ${i + 1}/${totalChapters} translated for book ${bookId}`);
    }

    await job.updateProgress(100);

    // processChapterTranslation auto-completes the BookTranslation when all chapters are done
    await this.hooksService.processAddonResult({
      bookId,
      addonId,
      addonKind,
      status: 'success',
      resultData: { targetLanguage, translationId: translation.id },
    });

    this.logger.log(`[translation] Translation completed for book ${bookId} → ${targetLanguage}`);
  }

  private async processAddonCoverTranslation(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind, params } = job.data;
    const targetLanguage = (params?.targetLanguage as string) || 'en';

    // Find the book with cover info
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: {
        title: true,
        subtitle: true,
        author: true,
        settings: true,
        selectedCoverFileId: true,
      },
    });

    if (!book) throw new Error(`Book ${bookId} not found`);

    if (!book.selectedCoverFileId) {
      throw new Error('No cover selected. Please select a cover before requesting cover translation.');
    }

    // Find the selected cover file
    const selectedCover = await this.prisma.bookFile.findFirst({
      where: { id: book.selectedCoverFileId, bookId, fileType: 'COVER_IMAGE' },
      select: { fileUrl: true },
    });

    if (!selectedCover) {
      throw new Error('Selected cover file not found.');
    }

    const referenceImageUrl = selectedCover.fileUrl;

    await job.updateProgress(10);

    // Translate title + subtitle
    const settings = book.settings as Record<string, unknown> | null;
    const sourceLanguage = (settings?.language as string) || 'en';
    const systemPrompt = getTranslationSystemPrompt(targetLanguage, sourceLanguage);

    const titleResult = await this.llmService.chatCompletionJson<{
      translatedTitle: string;
      translatedSubtitle: string;
    }>({
      model: this.config.llmModelGeneration,
      systemPrompt,
      userPrompt: buildTitleTranslationUserPrompt(book.title, book.subtitle, targetLanguage),
      schema: TITLE_TRANSLATION_SCHEMA,
      schemaName: 'title_translation',
    });

    await job.updateProgress(20);

    // Generate translated cover via multimodal image model
    const coverPrompt = buildCoverTranslationPrompt(
      targetLanguage,
      book.title,
      book.subtitle,
      book.author,
      titleResult.translatedTitle,
      titleResult.translatedSubtitle || null,
    );

    const imageResult = await this.llmService.generateImageWithReference({
      model: this.config.llmModelImage,
      prompt: coverPrompt,
      referenceImageUrl,
      temperature: 0.7,
    });

    await job.updateProgress(80);

    // Upload to S3
    const ext = imageResult.mimeType.includes('png') ? 'png' : 'jpg';
    const key = `covers/${bookId}/translated-${targetLanguage}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(imageResult.imageBase64, 'base64');
    const url = await this.storageService.upload(key, buffer, imageResult.mimeType);

    await job.updateProgress(95);

    await this.hooksService.processAddonResult({
      bookId,
      addonId,
      addonKind,
      status: 'success',
      resultUrl: url,
      resultData: {
        targetLanguage,
        translatedTitle: titleResult.translatedTitle,
        translatedSubtitle: titleResult.translatedSubtitle,
      },
    });

    this.logger.log(`[cover-translation] Cover translated for book ${bookId} → ${targetLanguage}`);
  }

  // ─── Audiobook Generation ────────────────────────────────────────────

  private async processAddonAudiobook(job: Job<AddonJobData>): Promise<void> {
    const { bookId, addonId, addonKind, params } = job.data;
    const translationId = (params?.translationId as string) || null;
    const voiceGender = ((params?.voiceGender as string) || 'female') as VoiceGender;

    // Each segment is either a chapter or a book section (intro, conclusion, etc.)
    interface AudioSegment {
      chapterId: string | null;
      sectionType: string | null; // introduction, conclusion, finalConsiderations, glossary, resourcesReferences, appendix, closure
      sequence: number;
      title: string;
      content: string;
    }

    // Section labels by language for TTS narration titles
    const sectionLabels: Record<string, Record<string, string>> = {
      en: { introduction: 'Introduction', conclusion: 'Conclusion', finalConsiderations: 'Final Considerations', glossary: 'Glossary', resourcesReferences: 'Resources and References', appendix: 'Appendix', closure: 'Closure' },
      'pt-BR': { introduction: 'Introdução', conclusion: 'Conclusão', finalConsiderations: 'Considerações Finais', glossary: 'Glossário', resourcesReferences: 'Recursos e Referências', appendix: 'Apêndice', closure: 'Encerramento' },
      es: { introduction: 'Introducción', conclusion: 'Conclusión', finalConsiderations: 'Consideraciones Finales', glossary: 'Glosario', resourcesReferences: 'Recursos y Referencias', appendix: 'Apéndice', closure: 'Cierre' },
    };

    let language: string;
    let segments: AudioSegment[];

    if (translationId) {
      // Translated book: fetch translated chapter content + back matter
      const translation = await this.prisma.bookTranslation.findUnique({
        where: { id: translationId },
        select: {
          targetLanguage: true,
          translatedIntroduction: true,
          translatedConclusion: true,
          translatedFinalConsiderations: true,
          translatedGlossary: true,
          translatedAppendix: true,
          translatedClosure: true,
          chapters: {
            where: { status: 'TRANSLATED' },
            orderBy: { sequence: 'asc' },
            select: {
              chapterId: true,
              sequence: true,
              translatedTitle: true,
              translatedContent: true,
            },
          },
        },
      });

      if (!translation) throw new Error(`Translation ${translationId} not found`);
      if (translation.chapters.length === 0) throw new Error(`Translation ${translationId} has no translated chapters`);

      language = translation.targetLanguage;
      const labels = sectionLabels[language] || sectionLabels['en'];

      // Build segments: intro → chapters → conclusion → finalConsiderations → glossary → appendix → closure
      segments = [];
      let seq = 0;

      if (translation.translatedIntroduction) {
        segments.push({ chapterId: null, sectionType: 'introduction', sequence: seq++, title: labels.introduction, content: translation.translatedIntroduction });
      }

      for (const ch of translation.chapters) {
        segments.push({ chapterId: ch.chapterId, sectionType: null, sequence: seq++, title: ch.translatedTitle || `Chapter ${ch.sequence}`, content: ch.translatedContent || '' });
      }

      if (translation.translatedConclusion) {
        segments.push({ chapterId: null, sectionType: 'conclusion', sequence: seq++, title: labels.conclusion, content: translation.translatedConclusion });
      }
      if (translation.translatedFinalConsiderations) {
        segments.push({ chapterId: null, sectionType: 'finalConsiderations', sequence: seq++, title: labels.finalConsiderations, content: translation.translatedFinalConsiderations });
      }
      if (translation.translatedGlossary) {
        const glossaryText = typeof translation.translatedGlossary === 'string' ? translation.translatedGlossary : JSON.stringify(translation.translatedGlossary);
        segments.push({ chapterId: null, sectionType: 'glossary', sequence: seq++, title: labels.glossary, content: glossaryText });
      }
      if (translation.translatedAppendix) {
        segments.push({ chapterId: null, sectionType: 'appendix', sequence: seq++, title: labels.appendix, content: translation.translatedAppendix });
      }
      if (translation.translatedClosure) {
        segments.push({ chapterId: null, sectionType: 'closure', sequence: seq++, title: labels.closure, content: translation.translatedClosure });
      }

      this.logger.log(`[audiobook] Generating audiobook for translation ${translationId} (${language}), ${segments.length} segments`);
    } else {
      // Original book: fetch original chapter content + back matter
      const book = await this.prisma.book.findUnique({
        where: { id: bookId },
        select: {
          settings: true,
          introduction: true,
          conclusion: true,
          finalConsiderations: true,
          glossary: true,
          resourcesReferences: true,
          appendix: true,
          closure: true,
          chapters: {
            where: { status: ChapterStatus.GENERATED },
            orderBy: { sequence: 'asc' },
            select: {
              id: true,
              sequence: true,
              title: true,
              content: true,
              editedContent: true,
              topics: true,
            },
          },
        },
      });

      if (!book) throw new Error(`Book ${bookId} not found`);
      if (book.chapters.length === 0) throw new Error(`Book ${bookId} has no generated chapters`);

      const settings = book.settings as Record<string, unknown> | null;
      language = (settings?.language as string) || 'en';
      const labels = sectionLabels[language] || sectionLabels['en'];

      // Build segments: intro → chapters → conclusion → finalConsiderations → glossary → resourcesReferences → appendix → closure
      segments = [];
      let seq = 0;

      if (book.introduction) {
        segments.push({ chapterId: null, sectionType: 'introduction', sequence: seq++, title: labels.introduction, content: book.introduction });
      }

      for (const ch of book.chapters) {
        let content = ch.editedContent || ch.content || '';
        if (!content && ch.topics) {
          const topics = ch.topics as Array<{ title: string; content: string }>;
          content = topics.map((t) => `${t.title}\n\n${t.content}`).join('\n\n');
        }
        segments.push({ chapterId: ch.id, sectionType: null, sequence: seq++, title: ch.title, content });
      }

      if (book.conclusion) {
        segments.push({ chapterId: null, sectionType: 'conclusion', sequence: seq++, title: labels.conclusion, content: book.conclusion });
      }
      if (book.finalConsiderations) {
        segments.push({ chapterId: null, sectionType: 'finalConsiderations', sequence: seq++, title: labels.finalConsiderations, content: book.finalConsiderations });
      }
      if (book.glossary) {
        const glossaryText = typeof book.glossary === 'string' ? book.glossary : JSON.stringify(book.glossary);
        segments.push({ chapterId: null, sectionType: 'glossary', sequence: seq++, title: labels.glossary, content: glossaryText });
      }
      if (book.resourcesReferences) {
        segments.push({ chapterId: null, sectionType: 'resourcesReferences', sequence: seq++, title: labels.resourcesReferences, content: book.resourcesReferences });
      }
      if (book.appendix) {
        segments.push({ chapterId: null, sectionType: 'appendix', sequence: seq++, title: labels.appendix, content: book.appendix });
      }
      if (book.closure) {
        segments.push({ chapterId: null, sectionType: 'closure', sequence: seq++, title: labels.closure, content: book.closure });
      }
    }

    const { voiceId, voiceName } = this.ttsService.getVoiceForLanguage(language, voiceGender);

    await job.updateProgress(5);

    const totalSegments = segments.length;
    const segmentResults: Array<{
      chapterId: string | null;
      sectionType: string | null;
      sequence: number;
      title: string;
      audioUrl: string;
      durationSecs: number;
    }> = [];
    const allBuffers: Buffer[] = [];
    let totalDuration = 0;

    const pathPrefix = translationId
      ? `audiobooks/${bookId}/tr-${translationId}`
      : `audiobooks/${bookId}`;

    for (let i = 0; i < totalSegments; i++) {
      const segment = segments[i];
      const cleanTitle = this.stripHtmlTags(segment.title);
      const cleanContent = this.stripHtmlTags(segment.content);
      const plainText = cleanTitle ? `${cleanTitle}.\n\n${cleanContent}` : cleanContent;

      if (!plainText.trim()) {
        this.logger.warn(`[audiobook] Segment ${segment.sequence} (${segment.sectionType || 'chapter'}) is empty, skipping`);
        continue;
      }

      const { buffer, durationSecs } = await this.ttsService.synthesize(plainText, voiceId);

      const fileLabel = segment.sectionType || `chapter-${segment.sequence}`;
      const key = `${pathPrefix}/${fileLabel}-${Date.now()}.mp3`;
      const audioUrl = await this.storageService.upload(key, buffer, 'audio/mpeg');

      segmentResults.push({
        chapterId: segment.chapterId,
        sectionType: segment.sectionType,
        sequence: segment.sequence,
        title: segment.title,
        audioUrl,
        durationSecs,
      });

      allBuffers.push(buffer);
      totalDuration += durationSecs;

      // Heartbeat + progress (5% → 85%)
      await job.updateProgress(5 + ((i + 1) / totalSegments) * 80);

      this.eventEmitter.emit('book.addon.progress', {
        bookId,
        addonId,
        status: 'generating',
        currentChapter: i + 1,
        totalChapters: totalSegments,
      });
    }

    if (segmentResults.length === 0) {
      throw new Error('No segments with content available for audiobook generation');
    }

    // Concatenate all segment buffers into full audiobook
    const fullBuffer = Buffer.concat(allBuffers);
    const fullKey = `${pathPrefix}/full-${Date.now()}.mp3`;
    const fullAudioUrl = await this.storageService.upload(fullKey, fullBuffer, 'audio/mpeg');

    await job.updateProgress(95);

    await this.hooksService.processAddonResult({
      bookId,
      addonId,
      addonKind,
      status: 'success',
      resultData: {
        voiceId,
        voiceName,
        totalDuration,
        fullAudioUrl,
        fullAudioSize: fullBuffer.length,
        translationId,
        chapters: segmentResults,
      },
    });

    this.logger.log(
      `[audiobook] Audiobook completed for book ${bookId}${translationId ? ` (translation ${translationId})` : ''}: ${segmentResults.length} segments, ${totalDuration}s total`,
    );
  }

  /** Strip HTML tags and Markdown formatting from content, returning plain text for TTS */
  private stripHtmlTags(html: string): string {
    return (
      html
        // HTML → plain text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Markdown → plain text
        .replace(/^#{1,6}\s+/gm, '') // headings: ## Title → Title
        .replace(/\*\*(.+?)\*\*/g, '$1') // bold: **text** → text
        .replace(/__(.+?)__/g, '$1') // bold: __text__ → text
        .replace(/\*(.+?)\*/g, '$1') // italic: *text* → text
        .replace(/_(.+?)_/g, '$1') // italic: _text_ → text
        .replace(/~~(.+?)~~/g, '$1') // strikethrough: ~~text~~ → text
        .replace(/`{3}[\s\S]*?`{3}/g, '') // code blocks: ```...``` → remove
        .replace(/`(.+?)`/g, '$1') // inline code: `text` → text
        .replace(/^\s*[-*+]\s+/gm, '') // unordered list markers: - item → item
        .replace(/^\s*\d+\.\s+/gm, '') // ordered list markers: 1. item → item
        .replace(/^>\s?/gm, '') // blockquotes: > text → text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links: [text](url) → text
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images: ![alt](url) → alt
        .replace(/^-{3,}$/gm, '') // horizontal rules: --- → remove
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
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
