import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { BookStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import type { SharedBookInfo, SharedBookPublicView } from '@bestsellers/shared';

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  async createShareLink(
    bookId: string,
    userId: string,
    translationId?: string,
  ): Promise<SharedBookInfo> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.GENERATED) {
      throw new BadRequestException(
        'Only fully generated books can be shared',
      );
    }

    // Check for existing active share (idempotent — match by bookId + translationId)
    const existing = await this.prisma.sharedBook.findFirst({
      where: { bookId, isActive: true, translationId: translationId ?? null },
    });

    if (existing) {
      return this.toSharedBookInfo(existing);
    }

    const shareToken = randomBytes(16).toString('base64url');

    const shared = await this.prisma.sharedBook.create({
      data: {
        bookId,
        shareToken,
        isActive: true,
        ...(translationId && { translationId }),
      },
    });

    this.logger.log(`Share link created for book ${bookId}${translationId ? ` (translation ${translationId})` : ''}: ${shareToken}`);

    return this.toSharedBookInfo(shared);
  }

  async deactivateShareLink(
    bookId: string,
    shareId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const shared = await this.prisma.sharedBook.findFirst({
      where: { id: shareId, bookId },
    });

    if (!shared) {
      throw new NotFoundException('Share link not found');
    }

    await this.prisma.sharedBook.update({
      where: { id: shareId },
      data: { isActive: false },
    });

    return { message: 'Share link deactivated' };
  }

  async getShareByBook(
    bookId: string,
    userId: string,
    translationId?: string,
  ): Promise<SharedBookInfo | null> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const shared = await this.prisma.sharedBook.findFirst({
      where: { bookId, isActive: true, translationId: translationId ?? null },
    });

    if (!shared) {
      return null;
    }

    return this.toSharedBookInfo(shared);
  }

  async getPublicBook(shareToken: string): Promise<SharedBookPublicView> {
    const shared = await this.prisma.sharedBook.findUnique({
      where: { shareToken },
      include: {
        book: {
          include: {
            chapters: {
              orderBy: { sequence: 'asc' },
            },
            files: {
              where: { fileType: { in: ['COVER_IMAGE', 'COVER_TRANSLATED'] } },
              select: { id: true, fileUrl: true, fileType: true, fileName: true },
            },
            selectedCoverFile: {
              select: { fileUrl: true },
            },
          },
        },
        translation: {
          include: {
            chapters: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    if (!shared || !shared.isActive) {
      throw new NotFoundException('Shared book not found');
    }

    // Check if book was soft-deleted
    if (shared.book.deletedAt) {
      throw new NotFoundException('Shared book not found');
    }

    // Check expiration
    if (shared.expiresAt && shared.expiresAt < new Date()) {
      throw new NotFoundException('Share link has expired');
    }

    // Increment view count (fire-and-forget)
    this.prisma.sharedBook
      .update({
        where: { id: shared.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        /* best-effort */
      });

    const { book, translation } = shared;

    // If this share is for a translation, overlay translated content
    if (translation) {
      const translatedChapterMap = new Map(
        translation.chapters.map((tc) => [tc.chapterId, tc]),
      );

      // Find translated cover for same language
      const translatedCover = book.files.find(
        (f) => f.fileType === 'COVER_TRANSLATED' && f.fileName.includes(translation.targetLanguage),
      );

      return {
        title: translation.translatedTitle || book.title,
        subtitle: translation.translatedSubtitle || book.subtitle,
        author: book.author,
        introduction: translation.translatedIntroduction || book.introduction,
        conclusion: translation.translatedConclusion || book.conclusion,
        finalConsiderations: translation.translatedFinalConsiderations || book.finalConsiderations,
        glossary: translation.translatedGlossary || ((book.glossary as string | null) ?? null),
        appendix: translation.translatedAppendix || book.appendix,
        closure: translation.translatedClosure || book.closure,
        chapters: book.chapters.map((ch) => {
          const tc = translatedChapterMap.get(ch.id);
          return {
            id: ch.id,
            sequence: ch.sequence,
            title: tc?.translatedTitle || ch.title,
            status: ch.status as unknown as SharedBookPublicView['chapters'][number]['status'],
            wordCount: ch.wordCount,
            isEdited: false,
            content: tc?.translatedContent || ch.editedContent || ch.content,
            editedContent: null,
            topics: tc?.translatedContent ? [] : (ch.topics as SharedBookPublicView['chapters'][number]['topics']),
            contextSummary: null,
            selectedImageId: ch.selectedImageId,
          };
        }),
        coverUrl: translatedCover?.fileUrl ?? book.selectedCoverFile?.fileUrl ?? book.files.find((f) => f.fileType === 'COVER_IMAGE')?.fileUrl ?? null,
        wordCount: book.wordCount,
        pageCount: book.pageCount,
      };
    }

    return {
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      introduction: book.introduction,
      conclusion: book.conclusion,
      finalConsiderations: book.finalConsiderations,
      glossary: (book.glossary as string | null) ?? null,
      appendix: book.appendix,
      closure: book.closure,
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
        status: ch.status as unknown as SharedBookPublicView['chapters'][number]['status'],
        wordCount: ch.wordCount,
        isEdited: ch.isEdited,
        content: ch.editedContent ?? ch.content,
        editedContent: ch.editedContent,
        topics: ch.topics as SharedBookPublicView['chapters'][number]['topics'],
        contextSummary: null,
        selectedImageId: ch.selectedImageId,
      })),
      coverUrl: book.selectedCoverFile?.fileUrl ?? book.files.find((f) => f.fileType === 'COVER_IMAGE')?.fileUrl ?? null,
      wordCount: book.wordCount,
      pageCount: book.pageCount,
    };
  }

  private toSharedBookInfo(shared: {
    id: string;
    shareToken: string;
    isActive: boolean;
    viewCount: number;
    expiresAt: Date | null;
    createdAt: Date;
  }): SharedBookInfo {
    return {
      id: shared.id,
      shareToken: shared.shareToken,
      isActive: shared.isActive,
      viewCount: shared.viewCount,
      expiresAt: shared.expiresAt?.toISOString() ?? null,
      shareUrl: `${this.appConfig.frontendUrl}/share/${shared.shareToken}`,
      createdAt: shared.createdAt.toISOString(),
    };
  }
}
