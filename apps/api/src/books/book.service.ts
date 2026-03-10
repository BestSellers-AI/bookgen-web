import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InsufficientCreditsException } from '../wallet/exceptions/insufficient-credits.exception';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookStatus,
  BookCreationMode,
  ChapterStatus,
  CreditType,
  FileType,
  Prisma,
  WalletTransactionType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { paginate, buildPaginatedResponse } from '../common/utils/paginate';
import { BookQueryDto, CreateBookDto, UpdatePlanningDto } from './dto';
import { N8nClientService } from '../n8n/n8n-client.service';
import { WalletService } from '../wallet/wallet.service';
import { MonthlyUsageService } from '../wallet/monthly-usage.service';
import {
  CREDITS_COST,
  SUBSCRIPTION_PLANS,
  QUEUE_PRIORITIES,
} from '@bestsellers/shared';
import type {
  PaginatedResponse,
  BookListItem,
  BookDetail,
} from '@bestsellers/shared';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly n8nClient: N8nClientService,
    private readonly walletService: WalletService,
    private readonly monthlyUsageService: MonthlyUsageService,
  ) {}

  async findAllByUser(
    userId: string,
    query: BookQueryDto,
  ): Promise<PaginatedResponse<BookListItem>> {
    const {
      page = 1,
      perPage = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.BookWhereInput = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        ...paginate(page, perPage),
        include: {
          _count: {
            select: { chapters: true },
          },
          chapters: {
            where: { status: ChapterStatus.GENERATED },
            select: { id: true },
          },
          files: {
            where: { fileType: FileType.COVER_IMAGE },
            take: 1,
            select: { fileUrl: true },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    const data: BookListItem[] = books.map((book) => ({
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      status: book.status as unknown as BookListItem['status'],
      creationMode: book.creationMode as unknown as BookListItem['creationMode'],
      chaptersCount: book._count.chapters,
      completedChaptersCount: book.chapters.length,
      coverUrl: book.files[0]?.fileUrl ?? null,
      wordCount: book.wordCount,
      pageCount: book.pageCount,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async findById(id: string, userId: string): Promise<BookDetail> {
    const book = await this.prisma.book.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        chapters: {
          orderBy: { sequence: 'asc' },
        },
        files: true,
        addons: true,
        translations: {
          include: {
            _count: {
              select: { chapters: true },
            },
          },
        },
        audiobooks: true,
        images: {
          orderBy: { position: 'asc' },
        },
        sharedBooks: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const share = book.sharedBooks[0] ?? null;

    return {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      briefing: book.briefing,
      status: book.status as unknown as BookDetail['status'],
      creationMode: book.creationMode as unknown as BookDetail['creationMode'],
      planning: book.planning as BookDetail['planning'],
      settings: book.settings as BookDetail['settings'],
      introduction: book.introduction,
      conclusion: book.conclusion,
      finalConsiderations: book.finalConsiderations,
      glossary: book.glossary as BookDetail['glossary'],
      resourcesReferences: book.resourcesReferences,
      appendix: book.appendix,
      closure: book.closure,
      wordCount: book.wordCount,
      pageCount: book.pageCount,
      chaptersCount: book.chapters.length,
      completedChaptersCount: book.chapters.filter(
        (ch) => ch.status === ChapterStatus.GENERATED,
      ).length,
      generationStartedAt: book.generationStartedAt?.toISOString() ?? null,
      generationCompletedAt: book.generationCompletedAt?.toISOString() ?? null,
      generationError: book.generationError,
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
        status: ch.status as unknown as BookDetail['chapters'][number]['status'],
        wordCount: ch.wordCount,
        isEdited: ch.isEdited,
        content: ch.content,
        editedContent: ch.editedContent,
        topics: ch.topics as BookDetail['chapters'][number]['topics'],
        contextSummary: ch.contextSummary,
      })),
      files: book.files.map((f) => ({
        id: f.id,
        fileType: f.fileType as unknown as BookDetail['files'][number]['fileType'],
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSizeBytes: f.fileSizeBytes,
        createdAt: f.createdAt.toISOString(),
      })),
      addons: book.addons.map((a) => ({
        id: a.id,
        kind: a.kind as unknown as BookDetail['addons'][number]['kind'],
        status: a.status as unknown as BookDetail['addons'][number]['status'],
        resultUrl: a.resultUrl,
        resultData: a.resultData as Record<string, unknown> | null,
        creditsCost: a.creditsCost,
        error: a.error,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      translations: book.translations.map((t) => ({
        id: t.id,
        targetLanguage: t.targetLanguage,
        status: t.status as unknown as BookDetail['translations'][number]['status'],
        translatedTitle: t.translatedTitle,
        translatedSubtitle: t.translatedSubtitle,
        totalChapters: t.totalChapters,
        completedChapters: t.completedChapters,
        createdAt: t.createdAt.toISOString(),
      })),
      audiobooks: book.audiobooks.map((ab) => ({
        id: ab.id,
        voiceName: ab.voiceName,
        status: ab.status as unknown as BookDetail['audiobooks'][number]['status'],
        totalDuration: ab.totalDuration,
        fullAudioUrl: ab.fullAudioUrl,
        createdAt: ab.createdAt.toISOString(),
      })),
      images: book.images.map((img) => ({
        id: img.id,
        chapterId: img.chapterId,
        prompt: img.prompt,
        imageUrl: img.imageUrl,
        caption: img.caption,
        position: img.position,
        createdAt: img.createdAt.toISOString(),
      })),
      share: share
        ? {
            id: share.id,
            shareToken: share.shareToken,
            isActive: share.isActive,
            viewCount: share.viewCount,
            expiresAt: share.expiresAt?.toISOString() ?? null,
            shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`,
            createdAt: share.createdAt.toISOString(),
          }
        : null,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    };
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const book = await this.prisma.book.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const allowedStatuses: BookStatus[] = [
      BookStatus.DRAFT,
      BookStatus.PREVIEW,
      BookStatus.PREVIEW_COMPLETED,
      BookStatus.CANCELLED,
    ];

    if (!allowedStatuses.includes(book.status)) {
      if (book.status === BookStatus.GENERATING) {
        throw new BadRequestException(
          'Cannot delete a book that is being generated',
        );
      }
      if (book.status === BookStatus.GENERATED) {
        throw new BadRequestException('Cannot delete a generated book');
      }
      throw new BadRequestException(
        `Cannot delete book with status: ${book.status}`,
      );
    }

    await this.prisma.book.update({
      where: { id: book.id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Create ────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateBookDto) {
    // Validate by mode
    if (dto.mode === BookCreationMode.SIMPLE) {
      if (!dto.title || !dto.subtitle) {
        throw new BadRequestException(
          'SIMPLE mode requires title and subtitle',
        );
      }
    }

    if (dto.mode === BookCreationMode.ADVANCED) {
      if (!dto.settings) {
        throw new BadRequestException('ADVANCED mode requires settings');
      }
    }

    // GUIDED mode only needs briefing + author (validated by DTO)

    const book = await this.prisma.book.create({
      data: {
        userId,
        creationMode: dto.mode,
        briefing: dto.briefing,
        author: dto.author,
        title: dto.title ?? 'Untitled',
        subtitle: dto.subtitle ?? null,
        settings: dto.settings ? (dto.settings as unknown as Prisma.JsonObject) : Prisma.JsonNull,
        status: BookStatus.DRAFT,
      },
    });

    this.logger.log(`Book created: ${book.id} (mode: ${dto.mode})`);
    return book;
  }

  // ─── Request Preview ───────────────────────────────────────────────

  async requestPreview(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const allowedForPreview: BookStatus[] = [
      BookStatus.DRAFT,
      BookStatus.ERROR,
      BookStatus.PREVIEW,
      BookStatus.PREVIEW_COMPLETED,
      BookStatus.PREVIEW_APPROVED,
    ];

    if (!allowedForPreview.includes(book.status)) {
      throw new BadRequestException(
        `Cannot request preview for book with status: ${book.status}`,
      );
    }

    // Check free tier rate limit
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });

    if (!activeSubscription) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const previewCount = await this.prisma.book.count({
        where: {
          userId,
          status: {
            in: [
              BookStatus.PREVIEW,
              BookStatus.PREVIEW_COMPLETING,
              BookStatus.PREVIEW_COMPLETED,
              BookStatus.PREVIEW_APPROVED,
              BookStatus.QUEUED,
              BookStatus.GENERATING,
              BookStatus.GENERATED,
            ],
          },
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      });

      if (previewCount >= 30) {
        throw new ForbiddenException(
          'Free tier preview limit reached (3/month)',
        );
      }
    }

    // Atomic status transition: only update if still in expected state
    const updated = await this.prisma.book.updateMany({
      where: {
        id: bookId,
        userId,
        deletedAt: null,
        status: { in: allowedForPreview },
      },
      data: {
        status: BookStatus.PREVIEW_GENERATING,
        generationError: null,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Book is no longer in a valid state for preview generation',
      );
    }

    const previewRequest = {
      briefing: book.briefing,
      author: book.author,
      title: book.title,
      subtitle: book.subtitle,
      creationMode: book.creationMode,
      settings: book.settings,
    };

    try {
      await this.n8nClient.dispatchPreview(bookId, previewRequest);
    } catch {
      // Revert status on dispatch failure
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: book.status,
          generationError: 'Failed to dispatch preview to processing engine',
        },
      });
      throw new BadRequestException(
        'Failed to start preview generation. Please try again.',
      );
    }
  }

  // ─── Get Preview Status ────────────────────────────────────────────

  async getPreviewStatus(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return {
      status: book.status,
      planning: book.planning,
      error: book.generationError,
    };
  }

  // ─── Update Planning ──────────────────────────────────────────────

  async updatePlanning(
    bookId: string,
    userId: string,
    dto: UpdatePlanningDto,
  ): Promise<BookDetail> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.PREVIEW) {
      throw new BadRequestException(
        `Cannot update planning for book with status: ${book.status}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete existing chapters
      await tx.chapter.deleteMany({ where: { bookId } });

      // Recreate chapters from DTO
      await tx.chapter.createMany({
        data: dto.chapters.map((ch, index) => ({
          bookId,
          sequence: index + 1,
          title: ch.title,
          topics: ch.topics as unknown as Prisma.InputJsonValue,
          status: ChapterStatus.PENDING,
        })),
      });

      // Update book planning + optional title/subtitle/author
      await tx.book.update({
        where: { id: bookId },
        data: {
          planning: {
            chapters: dto.chapters.map((ch, index) => ({
              sequence: index + 1,
              title: ch.title,
              topics: ch.topics,
            })),
            ...(dto.conclusion ? { conclusion: dto.conclusion } : {}),
            ...(dto.glossary ? { glossary: dto.glossary } : {}),
          } as unknown as Prisma.JsonObject,
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle || null } : {}),
          ...(dto.author ? { author: dto.author } : {}),
        },
      });
    });

    return this.findById(bookId, userId);
  }

  // ─── Approve Preview ──────────────────────────────────────────────

  async approvePreview(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      include: { chapters: { orderBy: { sequence: 'asc' } } },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.PREVIEW) {
      throw new BadRequestException(
        `Cannot approve preview for book with status: ${book.status}`,
      );
    }

    // Atomic: PREVIEW → PREVIEW_COMPLETING
    const updated = await this.prisma.book.updateMany({
      where: { id: bookId, userId, status: BookStatus.PREVIEW },
      data: { status: BookStatus.PREVIEW_COMPLETING },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Book is no longer in a valid state to approve',
      );
    }

    const completePreviewData = {
      briefing: book.briefing,
      author: book.author,
      title: book.title,
      subtitle: book.subtitle,
      creationMode: book.creationMode,
      settings: book.settings,
      planning: book.planning,
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
        topics: ch.topics,
      })),
    };

    try {
      await this.n8nClient.dispatchCompletePreview(bookId, completePreviewData);
    } catch {
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: BookStatus.PREVIEW,
          generationError: 'Failed to dispatch complete preview',
        },
      });
      throw new BadRequestException(
        'Failed to start complete preview generation. Please try again.',
      );
    }

    return book;
  }

  // ─── Request Generation ───────────────────────────────────────────

  async requestGeneration(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      include: { chapters: { orderBy: { sequence: 'asc' } } },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.PREVIEW_APPROVED && book.status !== BookStatus.PREVIEW_COMPLETED) {
      throw new BadRequestException(
        `Cannot generate book with status: ${book.status}`,
      );
    }

    const originalStatus = book.status;

    // Atomic status transition to QUEUED (prevents double-debit race)
    const locked = await this.prisma.book.updateMany({
      where: { id: bookId, userId, status: { in: [BookStatus.PREVIEW_APPROVED, BookStatus.PREVIEW_COMPLETED] } },
      data: {
        status: BookStatus.QUEUED,
        generationStartedAt: new Date(),
      },
    });

    if (locked.count === 0) {
      throw new BadRequestException(
        'Book is no longer in a valid state for generation',
      );
    }

    // Debit credits (throws InsufficientCreditsException with 402 if not enough)
    const cost = CREDITS_COST.BOOK_GENERATION;
    try {
      await this.walletService.debitCredits(
        userId,
        cost,
        WalletTransactionType.BOOK_GENERATION,
        'Book generation',
        { bookId },
      );
    } catch (error) {
      // Revert status on credit failure
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: originalStatus, generationStartedAt: null },
      });
      throw error;
    }

    // Determine queue priority based on user's subscription plan
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });

    const plan = activeSubscription?.plan as SubscriptionPlan | null;
    const queuePriority = plan
      ? QUEUE_PRIORITIES[SUBSCRIPTION_PLANS[plan].queuePriority]
      : QUEUE_PRIORITIES.standard;

    const generationData = {
      briefing: book.briefing,
      author: book.author,
      title: book.title,
      subtitle: book.subtitle,
      creationMode: book.creationMode,
      settings: book.settings,
      planning: book.planning,
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
        topics: ch.topics,
      })),
      queuePriority,
    };

    try {
      await this.n8nClient.dispatchGeneration(bookId, generationData);
    } catch {
      // Refund credits and revert status on dispatch failure
      await this.walletService.addCredits(
        userId,
        cost,
        CreditType.REFUND,
        {
          transactionType: WalletTransactionType.REFUND,
          description: 'Refund: generation dispatch failed',
        },
      );
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: originalStatus,
          generationStartedAt: null,
          generationError: 'Failed to dispatch generation to processing engine',
        },
      });
      throw new BadRequestException(
        'Failed to start book generation. Credits have been refunded.',
      );
    }

    // Update status to GENERATING
    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING },
    });

    this.logger.log(
      `Generation started for book ${bookId} (priority: ${queuePriority})`,
    );
  }

  // ─── Regenerate Chapter ───────────────────────────────────────────

  async regenerateChapter(
    bookId: string,
    chapterSequence: number,
    userId: string,
  ) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      include: { chapters: { orderBy: { sequence: 'asc' } } },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const chapter = book.chapters.find(
      (ch) => ch.sequence === chapterSequence,
    );
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (book.status !== BookStatus.GENERATED) {
      throw new BadRequestException(
        `Cannot regenerate chapter for book with status: ${book.status}`,
      );
    }

    // Try free regeneration first
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });

    const plan = activeSubscription?.plan as SubscriptionPlan | null;
    const usedFreeRegen = await this.monthlyUsageService.useFreeRegen(
      userId,
      plan,
    );

    if (!usedFreeRegen) {
      // Free regens exhausted, debit credits (throws 402 if not enough)
      const cost = CREDITS_COST.CHAPTER_REGENERATION;
      await this.walletService.debitCredits(
        userId,
        cost,
        WalletTransactionType.BOOK_GENERATION,
        'Chapter regeneration',
        { bookId },
      );
    }

    // Update chapter status
    await this.prisma.chapter.update({
      where: { id: chapter.id },
      data: { status: ChapterStatus.GENERATING },
    });

    // Dispatch to n8n
    const chapterData = {
      chapterId: chapter.id,
      chapterSequence: chapter.sequence,
      chapterTitle: chapter.title,
      chapterTopics: chapter.topics,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookBriefing: book.briefing,
      bookSettings: book.settings,
      bookPlanning: book.planning,
    };

    try {
      await this.n8nClient.dispatchGeneration(bookId, {
        type: 'chapter-regeneration',
        ...chapterData,
      });
    } catch {
      // Revert chapter status on dispatch failure
      await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: { status: ChapterStatus.GENERATED },
      });

      // Refund if credits were debited (not free regen)
      if (!usedFreeRegen) {
        const cost = CREDITS_COST.CHAPTER_REGENERATION;
        await this.walletService.addCredits(
          userId,
          cost,
          CreditType.REFUND,
          {
            transactionType: WalletTransactionType.REFUND,
            description: 'Refund: chapter regeneration dispatch failed',
          },
        );
      }

      throw new BadRequestException(
        'Failed to start chapter regeneration. Please try again.',
      );
    }

    this.logger.log(
      `Chapter ${chapterSequence} regeneration started for book ${bookId}`,
    );
  }
}
