import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BookStatus,
  ChapterStatus,
  AddonStatus,
  FileType,
  NotificationType,
  ProductKind,
  TranslationStatus,
  PublishingStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { TranslationService } from '../translations/translation.service';
import {
  PreviewResultDto,
  ChapterResultDto,
  GenerationCompleteDto,
  GenerationErrorDto,
  AddonResultDto,
  TranslationChapterResultDto,
} from './dto';

@Injectable()
export class HooksService {
  private readonly logger = new Logger(HooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly translationService: TranslationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Preview Result                                                     */
  /* ------------------------------------------------------------------ */
  async processPreviewResult(dto: PreviewResultDto) {
    this.logger.log(`Processing preview result for book ${dto.bookId}`);

    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    /* ---------- Error path ---------- */
    if (dto.status === 'error') {
      await this.prisma.book.update({
        where: { id: dto.bookId },
        data: {
          status: BookStatus.ERROR,
          generationError: dto.error ?? 'Unknown preview error',
        },
      });

      this.eventEmitter.emit('book.preview.progress', {
        bookId: dto.bookId,
        status: 'error',
        error: dto.error,
      });

      await this.notifications.create({
        userId: book.userId,
        type: NotificationType.BOOK_GENERATION_ERROR,
        title: 'Preview generation failed',
        message: dto.error ?? 'An error occurred while generating the preview.',
        data: { bookId: dto.bookId },
      });

      return;
    }

    /* ---------- Success path ---------- */
    const planning = dto.planning as Prisma.InputJsonValue | undefined;
    const chapters =
      (dto.planning as Record<string, unknown>)?.chapters as
        | Array<{ title?: string; topics?: string[] }>
        | undefined;

    // Update book
    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        status: BookStatus.PREVIEW,
        ...(dto.title && { title: dto.title }),
        ...(dto.subtitle && { subtitle: dto.subtitle }),
        ...(planning !== undefined && { planning }),
      },
    });

    // Delete existing chapters (handles retry case)
    await this.prisma.chapter.deleteMany({
      where: { bookId: dto.bookId },
    });

    // Create chapters from planning
    if (chapters && chapters.length > 0) {
      await this.prisma.chapter.createMany({
        data: chapters.map((ch, index) => ({
          bookId: dto.bookId,
          sequence: index + 1,
          title: ch.title ?? `Chapter ${index + 1}`,
          topics: (ch.topics ?? []) as Prisma.InputJsonValue,
          status: ChapterStatus.PENDING,
        })),
      });
    }

    this.eventEmitter.emit('book.preview.progress', {
      bookId: dto.bookId,
      status: 'ready',
    });

    await this.notifications.create({
      userId: book.userId,
      type: NotificationType.BOOK_PREVIEW_READY,
      title: 'Preview ready',
      message: `Your book preview "${dto.title ?? book.title}" is ready for review.`,
      data: { bookId: dto.bookId },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Chapter Result                                                     */
  /* ------------------------------------------------------------------ */
  async processChapterResult(dto: ChapterResultDto) {
    this.logger.log(
      `Processing chapter result for book ${dto.bookId}, chapter #${dto.chapterSequence}`,
    );

    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    const chapter = await this.prisma.chapter.findFirst({
      where: { bookId: dto.bookId, sequence: dto.chapterSequence },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter #${dto.chapterSequence} not found for book ${dto.bookId}`,
      );
    }

    /* ---------- Error path ---------- */
    if (dto.status === 'error') {
      await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: { status: ChapterStatus.ERROR },
      });

      this.eventEmitter.emit('book.generation.progress', {
        bookId: dto.bookId,
        chapterSequence: dto.chapterSequence,
        status: 'error',
        error: dto.error,
      });

      return;
    }

    /* ---------- Success path ---------- */
    await this.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        content: dto.content,
        topics: (dto.topics ?? []) as Prisma.InputJsonValue,
        contextSummary: dto.contextSummary,
        wordCount: dto.wordCount,
        status: ChapterStatus.GENERATED,
      },
    });

    // Count progress
    const [totalChapters, completedChapters] = await Promise.all([
      this.prisma.chapter.count({ where: { bookId: dto.bookId } }),
      this.prisma.chapter.count({
        where: { bookId: dto.bookId, status: ChapterStatus.GENERATED },
      }),
    ]);

    this.eventEmitter.emit('book.generation.progress', {
      bookId: dto.bookId,
      chapterSequence: dto.chapterSequence,
      status: 'success',
      totalChapters,
      completedChapters,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Generation Complete                                                */
  /* ------------------------------------------------------------------ */
  async processGenerationComplete(dto: GenerationCompleteDto) {
    this.logger.log(`Processing generation complete for book ${dto.bookId}`);

    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        status: BookStatus.GENERATED,
        wordCount: dto.wordCount,
        pageCount: dto.pageCount,
        generationCompletedAt: new Date(),
      },
    });

    if (dto.pdfUrl) {
      await this.prisma.bookFile.create({
        data: {
          bookId: dto.bookId,
          fileType: FileType.FULL_PDF,
          fileName: 'book.pdf',
          fileUrl: dto.pdfUrl,
        },
      });
    }

    this.eventEmitter.emit('book.generation.progress', {
      bookId: dto.bookId,
      status: 'complete',
    });

    await this.notifications.create({
      userId: book.userId,
      type: NotificationType.BOOK_GENERATED,
      title: 'Book generated',
      message: `Your book "${book.title}" has been fully generated.`,
      data: { bookId: dto.bookId },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Generation Error                                                   */
  /* ------------------------------------------------------------------ */
  async processGenerationError(dto: GenerationErrorDto) {
    this.logger.log(`Processing generation error for book ${dto.bookId}`);

    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        status: BookStatus.ERROR,
        generationError: dto.error,
      },
    });

    this.eventEmitter.emit('book.generation.progress', {
      bookId: dto.bookId,
      status: 'error',
      error: dto.error,
    });

    await this.notifications.create({
      userId: book.userId,
      type: NotificationType.BOOK_GENERATION_ERROR,
      title: 'Generation failed',
      message: dto.error,
      data: { bookId: dto.bookId, phase: dto.phase },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Addon Result                                                       */
  /* ------------------------------------------------------------------ */
  async processAddonResult(dto: AddonResultDto) {
    this.logger.log(`Processing addon result for addon ${dto.addonId}`);

    const addon = await this.prisma.bookAddon.findUnique({
      where: { id: dto.addonId },
      include: { book: { select: { userId: true } } },
    });

    if (!addon) {
      throw new NotFoundException(`Addon ${dto.addonId} not found`);
    }

    /* ---------- Error path ---------- */
    if (dto.status === 'error') {
      await this.prisma.bookAddon.update({
        where: { id: dto.addonId },
        data: {
          status: AddonStatus.ERROR,
          error: dto.error ?? 'Unknown addon error',
        },
      });

      await this.notifications.create({
        userId: addon.book.userId,
        type: NotificationType.ADDON_ERROR,
        title: 'Add-on failed',
        message: dto.error ?? 'An error occurred processing the add-on.',
        data: { bookId: dto.bookId, addonId: dto.addonId, kind: dto.addonKind },
      });

      this.eventEmitter.emit('book.addon.progress', {
        bookId: dto.bookId,
        addonId: dto.addonId,
        status: 'error',
        error: dto.error,
      });

      return;
    }

    /* ---------- Success path ---------- */
    await this.prisma.bookAddon.update({
      where: { id: dto.addonId },
      data: {
        status: AddonStatus.COMPLETED,
        resultUrl: dto.resultUrl,
        resultData: (dto.resultData ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });

    // Addon-specific processing
    await this.processAddonSpecific(dto);

    await this.notifications.create({
      userId: addon.book.userId,
      type: NotificationType.ADDON_COMPLETED,
      title: 'Add-on completed',
      message: `Your add-on "${dto.addonKind}" has been completed.`,
      data: { bookId: dto.bookId, addonId: dto.addonId, kind: dto.addonKind },
    });

    this.eventEmitter.emit('book.addon.progress', {
      bookId: dto.bookId,
      addonId: dto.addonId,
      status: 'success',
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Translation Chapter (called by n8n per-chapter)                    */
  /* ------------------------------------------------------------------ */
  async processTranslationChapter(dto: TranslationChapterResultDto) {
    this.logger.log(
      `Processing translation chapter for translation ${dto.translationId}, chapter ${dto.chapterId}`,
    );

    await this.translationService.processChapterTranslation(
      dto.translationId,
      {
        chapterId: dto.chapterId,
        translatedTitle: dto.translatedTitle,
        translatedContent: dto.translatedContent,
      },
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Addon-specific processing (on success)                             */
  /* ------------------------------------------------------------------ */
  private async processAddonSpecific(dto: AddonResultDto): Promise<void> {
    const resultData = dto.resultData as Record<string, unknown> | undefined;

    switch (dto.addonKind) {
      case ProductKind.ADDON_COVER: {
        // Create BookFile records for cover variations
        const variations = (resultData?.variations ?? []) as Array<{
          url: string;
          fileName?: string;
        }>;

        if (variations.length > 0) {
          await this.prisma.bookFile.createMany({
            data: variations.map((v, i) => ({
              bookId: dto.bookId,
              fileType: FileType.COVER_IMAGE,
              fileName: v.fileName ?? `cover-${i + 1}.png`,
              fileUrl: v.url,
            })),
          });
        }
        break;
      }

      case ProductKind.ADDON_TRANSLATION: {
        // Create BookTranslation + TranslationChapter records
        const targetLanguage = (resultData?.targetLanguage as string) ?? 'unknown';
        const translatedTitle = resultData?.translatedTitle as string | undefined;
        const translatedSubtitle = resultData?.translatedSubtitle as string | undefined;

        // Get book chapters to create translation chapter records
        const chapters = await this.prisma.chapter.findMany({
          where: { bookId: dto.bookId },
          orderBy: { sequence: 'asc' },
          select: { id: true, sequence: true, title: true },
        });

        await this.prisma.bookTranslation.create({
          data: {
            bookId: dto.bookId,
            targetLanguage,
            status: TranslationStatus.TRANSLATING,
            translatedTitle: translatedTitle ?? null,
            translatedSubtitle: translatedSubtitle ?? null,
            totalChapters: chapters.length,
            completedChapters: 0,
            chapters: {
              create: chapters.map((ch) => ({
                chapterId: ch.id,
                sequence: ch.sequence,
                status: TranslationStatus.PENDING,
              })),
            },
          },
        });
        break;
      }

      case ProductKind.ADDON_COVER_TRANSLATION: {
        // Create BookFile for translated cover
        if (dto.resultUrl) {
          await this.prisma.bookFile.create({
            data: {
              bookId: dto.bookId,
              fileType: FileType.COVER_TRANSLATED,
              fileName: 'cover-translated.png',
              fileUrl: dto.resultUrl,
            },
          });
        }
        break;
      }

      case ProductKind.ADDON_AMAZON_STANDARD:
      case ProductKind.ADDON_AMAZON_PREMIUM: {
        // Create PublishingRequest
        const platform = (resultData?.platform as string) ?? 'amazon_kdp';

        await this.prisma.publishingRequest.create({
          data: {
            bookId: dto.bookId,
            addonId: dto.addonId,
            platform,
            status: PublishingStatus.READY,
            metadata: (resultData?.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
          },
        });
        break;
      }

      case ProductKind.ADDON_IMAGES: {
        // Create BookImage records
        const images = (resultData?.images ?? []) as Array<{
          chapterId?: string;
          prompt: string;
          imageUrl: string;
          caption?: string;
          position: number;
        }>;

        if (images.length > 0) {
          await this.prisma.bookImage.createMany({
            data: images.map((img) => ({
              bookId: dto.bookId,
              chapterId: img.chapterId ?? null,
              prompt: img.prompt,
              imageUrl: img.imageUrl,
              caption: img.caption ?? null,
              position: img.position,
            })),
          });
        }
        break;
      }

      case ProductKind.ADDON_AUDIOBOOK: {
        // Create Audiobook + AudiobookChapter records
        const voiceId = resultData?.voiceId as string | undefined;
        const voiceName = resultData?.voiceName as string | undefined;
        const totalDuration = resultData?.totalDuration as number | undefined;
        const fullAudioUrl = resultData?.fullAudioUrl as string | undefined;
        const fullAudioSize = resultData?.fullAudioSize as number | undefined;
        const audioChapters = (resultData?.chapters ?? []) as Array<{
          chapterId: string;
          sequence: number;
          title: string;
          audioUrl: string;
          durationSecs: number;
        }>;

        await this.prisma.audiobook.create({
          data: {
            bookId: dto.bookId,
            voiceId: voiceId ?? null,
            voiceName: voiceName ?? null,
            status: AddonStatus.COMPLETED,
            totalDuration: totalDuration ?? null,
            fullAudioUrl: fullAudioUrl ?? null,
            fullAudioSize: fullAudioSize ?? null,
            chapters: {
              create: audioChapters.map((ch) => ({
                chapterId: ch.chapterId,
                sequence: ch.sequence,
                title: ch.title,
                audioUrl: ch.audioUrl,
                durationSecs: ch.durationSecs,
                status: ChapterStatus.GENERATED,
              })),
            },
          },
        });
        break;
      }

      default:
        this.logger.warn(`Unknown addon kind: ${dto.addonKind}`);
    }
  }
}
