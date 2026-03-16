import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BookStatus,
  ChapterStatus,
  AddonStatus,
  CreditType,
  WalletTransactionType,
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
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { AppConfigService } from '../config/app-config.service';
import { bookGeneratedEmail } from '../email/email-templates';
import { countWords, estimatePageCount } from '../common/word-count';
import {
  PreviewResultDto,
  PreviewCompleteResultDto,
  ChapterResultDto,
  GenerationCompleteDto,
  GenerationErrorDto,
  AddonResultDto,
  TranslationChapterResultDto,
  BookContextDto,
} from './dto';

@Injectable()
export class HooksService {
  private readonly logger = new Logger(HooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly translationService: TranslationService,
    private readonly walletService: WalletService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
    private readonly appConfig: AppConfigService,
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

    // Idempotency: skip if already processed
    if (
      book.status === BookStatus.PREVIEW ||
      book.status === BookStatus.PREVIEW_APPROVED ||
      book.status === BookStatus.PREVIEW_COMPLETING ||
      book.status === BookStatus.PREVIEW_COMPLETED
    ) {
      this.logger.warn(`Preview for book ${dto.bookId} already processed, skipping`);
      return;
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

    // Update book — structure only (no front/back matter, no files)
    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        status: BookStatus.PREVIEW,
        ...(dto.title && { title: dto.title }),
        ...(dto.subtitle && { subtitle: dto.subtitle }),
        ...(dto.author && { author: dto.author }),
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
  /*  Preview Complete Result                                            */
  /* ------------------------------------------------------------------ */
  async processPreviewCompleteResult(dto: PreviewCompleteResultDto) {
    this.logger.log(`Processing preview complete result for book ${dto.bookId}`);

    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    // Idempotency: skip if already processed
    if (
      book.status === BookStatus.PREVIEW_COMPLETED ||
      book.status === BookStatus.PREVIEW_APPROVED
    ) {
      this.logger.warn(`Preview complete for book ${dto.bookId} already processed, skipping`);
      return;
    }

    /* ---------- Error path ---------- */
    if (dto.status === 'error') {
      // Revert to PREVIEW so user can retry
      await this.prisma.book.update({
        where: { id: dto.bookId },
        data: {
          status: BookStatus.PREVIEW,
          generationError: dto.error ?? 'Unknown preview complete error',
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
        title: 'Complete preview generation failed',
        message: dto.error ?? 'An error occurred while generating the complete preview.',
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

    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        status: BookStatus.PREVIEW_COMPLETED,
        ...(planning !== undefined && { planning }),
        ...(dto.introduction && { introduction: dto.introduction }),
        ...(dto.conclusion && { conclusion: dto.conclusion }),
        ...(dto.finalConsiderations && { finalConsiderations: dto.finalConsiderations }),
        ...(dto.glossary && { glossary: dto.glossary as unknown as Prisma.InputJsonValue }),
        ...(dto.appendix && { appendix: dto.appendix }),
        ...(dto.closure && { closure: dto.closure }),
      },
    });

    // Recreate chapters with expanded topics from updated planning
    if (chapters && chapters.length > 0) {
      await this.prisma.chapter.deleteMany({
        where: { bookId: dto.bookId },
      });

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

    // Delete old preview files for idempotency
    await this.prisma.bookFile.deleteMany({
      where: {
        bookId: dto.bookId,
        fileType: { in: [FileType.PREVIEW_PDF, FileType.DOCX, FileType.EPUB] },
      },
    });

    // Create new file records
    if (dto.pdfUrl) {
      await this.prisma.bookFile.create({
        data: {
          bookId: dto.bookId,
          fileType: FileType.PREVIEW_PDF,
          fileName: 'preview.pdf',
          fileUrl: dto.pdfUrl,
        },
      });
    }

    if (dto.docxUrl) {
      await this.prisma.bookFile.create({
        data: {
          bookId: dto.bookId,
          fileType: FileType.DOCX,
          fileName: 'preview.docx',
          fileUrl: dto.docxUrl,
        },
      });
    }

    if (dto.epubUrl) {
      await this.prisma.bookFile.create({
        data: {
          bookId: dto.bookId,
          fileType: FileType.EPUB,
          fileName: 'preview.epub',
          fileUrl: dto.epubUrl,
        },
      });
    }

    this.eventEmitter.emit('book.preview.progress', {
      bookId: dto.bookId,
      status: 'complete_ready',
    });

    await this.notifications.create({
      userId: book.userId,
      type: NotificationType.BOOK_PREVIEW_READY,
      title: 'Complete preview ready',
      message: `Your complete book preview "${book.title}" is ready for review.`,
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

    // Idempotency: skip if chapter already generated
    if (chapter.status === ChapterStatus.GENERATED && dto.status === 'success') {
      this.logger.warn(`Chapter #${dto.chapterSequence} of book ${dto.bookId} already generated, skipping`);
      return;
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
    // Count words from topics content (primary) or fallback to dto.content
    const topicsContent = (dto.topics ?? [])
      .map((t: { content?: string }) => t.content ?? '')
      .join(' ');
    const chapterWordCount = countWords(topicsContent || dto.content);

    await this.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        content: dto.content,
        topics: (dto.topics ?? []) as unknown as Prisma.InputJsonValue,
        contextSummary: dto.contextSummary,
        wordCount: chapterWordCount,
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

    // Idempotency: skip if already generated
    if (book.status === BookStatus.GENERATED) {
      this.logger.warn(`Book ${dto.bookId} already generated, skipping`);
      return;
    }

    // Calculate word count internally from all chapters + sections
    const chapters = await this.prisma.chapter.findMany({
      where: { bookId: dto.bookId, status: ChapterStatus.GENERATED },
      select: { wordCount: true },
    });
    const chaptersWordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount ?? 0), 0);
    const sectionsWordCount =
      countWords(dto.introduction) +
      countWords(dto.conclusion) +
      countWords(dto.finalConsiderations) +
      countWords(dto.glossary) +
      countWords(dto.appendix) +
      countWords(dto.closure);
    const totalWordCount = chaptersWordCount + sectionsWordCount;

    // Count sections that exist (each starts on a new page in PDF)
    const sectionCount = [
      dto.introduction,
      dto.conclusion,
      dto.finalConsiderations,
      dto.glossary,
      dto.appendix,
      dto.closure,
    ].filter(Boolean).length;

    const totalPageCount = estimatePageCount(totalWordCount, {
      chapterCount: chapters.length,
      sectionCount,
    });

    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        status: BookStatus.GENERATED,
        wordCount: totalWordCount,
        pageCount: totalPageCount,
        generationCompletedAt: new Date(),
        ...(dto.introduction && { introduction: dto.introduction }),
        ...(dto.conclusion && { conclusion: dto.conclusion }),
        ...(dto.finalConsiderations && { finalConsiderations: dto.finalConsiderations }),
        ...(dto.resourcesReferences && { resourcesReferences: dto.resourcesReferences }),
        ...(dto.glossary && { glossary: dto.glossary as unknown as Prisma.InputJsonValue }),
        ...(dto.appendix && { appendix: dto.appendix }),
        ...(dto.closure && { closure: dto.closure }),
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

    if (dto.docxUrl) {
      await this.prisma.bookFile.create({
        data: {
          bookId: dto.bookId,
          fileType: FileType.DOCX,
          fileName: 'book.docx',
          fileUrl: dto.docxUrl,
        },
      });
    }

    if (dto.epubUrl) {
      await this.prisma.bookFile.create({
        data: {
          bookId: dto.bookId,
          fileType: FileType.EPUB,
          fileName: 'book.epub',
          fileUrl: dto.epubUrl,
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

    const user = await this.prisma.user.findUnique({
      where: { id: book.userId },
      select: { email: true, name: true, locale: true },
    });
    if (user) {
      const bookUrl = `${this.appConfig.frontendUrl}/dashboard/books/${dto.bookId}`;
      const email = bookGeneratedEmail({
        userName: user.name ?? 'there',
        bookTitle: book.title,
        bookUrl,
        locale: user.locale,
      });
      this.emailService.send({
        to: user.email,
        subject: email.subject,
        html: email.html,
      });
    }
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

    // Idempotency: skip if already completed or in a terminal state
    if (addon.status === AddonStatus.COMPLETED || addon.status === AddonStatus.CANCELLED) {
      this.logger.warn(`Addon ${dto.addonId} already ${addon.status}, skipping`);
      return;
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

      // Mark associated BookTranslation as ERROR if this was a translation addon
      if (dto.addonKind === ProductKind.ADDON_TRANSLATION) {
        // Find TRANSLATING translations for this book and mark as ERROR
        await this.prisma.bookTranslation.updateMany({
          where: { bookId: dto.bookId, status: TranslationStatus.TRANSLATING },
          data: { status: TranslationStatus.ERROR },
        });
      }

      // Refund credits on addon failure
      if (addon.creditsCost && addon.creditsCost > 0) {
        try {
          await this.walletService.addCredits(
            addon.book.userId,
            addon.creditsCost,
            CreditType.REFUND,
            {
              description: `Refund: ${dto.addonKind} add-on failed`,
              transactionType: WalletTransactionType.REFUND,
            },
          );
          this.logger.log(
            `Refunded ${addon.creditsCost} credits for failed addon ${dto.addonId}`,
          );
        } catch (refundError) {
          this.logger.error(
            `Failed to refund credits for addon ${dto.addonId}: ${refundError}`,
          );
        }
      }

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
    // Process addon-specific records BEFORE marking as COMPLETED
    await this.processAddonSpecific(dto);

    await this.prisma.bookAddon.update({
      where: { id: dto.addonId },
      data: {
        status: AddonStatus.COMPLETED,
        resultUrl: dto.resultUrl,
        resultData: (dto.resultData ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });

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
  /*  Book Chapters (for n8n)                                            */
  /* ------------------------------------------------------------------ */
  async getBookChapters(bookId: string) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException(`Book ${bookId} not found`);
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { bookId },
      orderBy: { sequence: 'asc' },
    });

    return {
      bookId,
      chapters: chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
        status: ch.status,
        content: ch.content,
        topics: ch.topics,
        contextSummary: ch.contextSummary,
        wordCount: ch.wordCount,
      })),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Book Context (GET + POST for n8n)                                  */
  /* ------------------------------------------------------------------ */
  async getBookContext(bookId: string) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, context: true },
    });

    if (!book) {
      throw new NotFoundException(`Book ${bookId} not found`);
    }

    return { bookId, context: book.context };
  }

  async updateBookContext(dto: BookContextDto) {
    const result = await this.prisma.book.updateMany({
      where: { id: dto.bookId },
      data: { context: dto.context },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    return { updated: true };
  }

  /* ------------------------------------------------------------------ */
  /*  Recalculate page count (after images are added/removed)            */
  /* ------------------------------------------------------------------ */
  private async recalculatePageCount(bookId: string): Promise<void> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: {
        wordCount: true,
        introduction: true,
        conclusion: true,
        finalConsiderations: true,
        glossary: true,
        appendix: true,
        closure: true,
        chapters: {
          where: { status: ChapterStatus.GENERATED },
          select: { id: true, selectedImageId: true },
        },
      },
    });
    if (!book) return;

    const sectionCount = [
      book.introduction,
      book.conclusion,
      book.finalConsiderations,
      book.glossary,
      book.appendix,
      book.closure,
    ].filter(Boolean).length;

    const imageCount = book.chapters.filter((ch) => ch.selectedImageId).length;

    const pageCount = estimatePageCount(book.wordCount ?? 0, {
      chapterCount: book.chapters.length,
      imageCount,
      sectionCount,
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: { pageCount },
    });
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
        // Translation records are now created by processAddonTranslation in the processor.
        // The resultData contains the translationId for reference.
        // If a translationId is provided, the translation was already created by the processor.
        const translationId = resultData?.translationId as string | undefined;
        if (translationId) {
          this.logger.log(`Translation ${translationId} already created by processor for book ${dto.bookId}`);
        }
        break;
      }

      case ProductKind.ADDON_COVER_TRANSLATION: {
        // Upsert BookFile for translated cover (replace existing for same language)
        const coverTargetLang = (resultData?.targetLanguage as string) ?? 'unknown';
        const coverFileName = `cover-translated-${coverTargetLang}.png`;
        if (dto.resultUrl) {
          // Delete existing cover for same language (regeneration replaces, not duplicates)
          await this.prisma.bookFile.deleteMany({
            where: {
              bookId: dto.bookId,
              fileType: FileType.COVER_TRANSLATED,
              fileName: coverFileName,
            },
          });
          await this.prisma.bookFile.create({
            data: {
              bookId: dto.bookId,
              fileType: FileType.COVER_TRANSLATED,
              fileName: coverFileName,
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
        // Create BookImage records — supports both formats:
        // Format A (structured): resultData.images = [{ chapterId, prompt, imageUrl, caption, position }]
        // Format B (variations): resultData.variations = [{ url, label }]
        const rawImages = (resultData?.images ?? []) as Array<{
          chapterId?: string;
          prompt?: string;
          imageUrl?: string;
          url?: string;
          caption?: string;
          label?: string;
          position?: number;
        }>;
        const rawVariations = (resultData?.variations ?? []) as Array<{
          url: string;
          label?: string;
        }>;

        const normalized = rawImages.length > 0
          ? rawImages.map((img, i) => ({
              bookId: dto.bookId,
              chapterId: img.chapterId ?? null,
              prompt: img.prompt ?? img.label ?? '',
              imageUrl: img.imageUrl ?? img.url ?? '',
              caption: img.caption ?? img.label ?? null,
              position: img.position ?? i,
            }))
          : rawVariations.map((v, i) => ({
              bookId: dto.bookId,
              chapterId: null,
              prompt: v.label ?? '',
              imageUrl: v.url,
              caption: v.label ?? null,
              position: i,
            }));

        if (normalized.length > 0) {
          await this.prisma.bookImage.createMany({ data: normalized });

          // Auto-assign only to chapters that don't already have an image
          const withChapter = normalized.filter((img) => img.chapterId);
          if (withChapter.length > 0) {
            // Get chapters that have no selectedImageId yet
            const unassignedChapters = await this.prisma.chapter.findMany({
              where: {
                bookId: dto.bookId,
                id: { in: withChapter.map((img) => img.chapterId!) },
                selectedImageId: null,
              },
              select: { id: true },
            });
            const unassignedSet = new Set(unassignedChapters.map((ch) => ch.id));

            if (unassignedSet.size > 0) {
              // Find the newly created images (most recent per chapterId)
              const created = await this.prisma.bookImage.findMany({
                where: {
                  bookId: dto.bookId,
                  chapterId: { in: [...unassignedSet] },
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true, chapterId: true },
              });

              // Take only the first (newest) image per chapter
              const imageByChapter = new Map<string, string>();
              for (const img of created) {
                if (img.chapterId && !imageByChapter.has(img.chapterId)) {
                  imageByChapter.set(img.chapterId, img.id);
                }
              }

              await Promise.all(
                [...imageByChapter.entries()].map(([chapterId, imageId]) =>
                  this.prisma.chapter.update({
                    where: { id: chapterId },
                    data: { selectedImageId: imageId },
                  }),
                ),
              );
            }
          }

          // Recalculate pageCount to account for full-page images
          await this.recalculatePageCount(dto.bookId);
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
