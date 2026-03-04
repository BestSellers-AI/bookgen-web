import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import {
  TranslationStatus,
  NotificationType,
} from '@prisma/client';
import type { BookTranslationSummary } from '@bestsellers/shared';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async getByBook(
    bookId: string,
    userId: string,
  ): Promise<BookTranslationSummary[]> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const translations = await this.prisma.bookTranslation.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });

    return translations.map((t) => ({
      id: t.id,
      targetLanguage: t.targetLanguage,
      status: t.status as unknown as BookTranslationSummary['status'],
      translatedTitle: t.translatedTitle,
      translatedSubtitle: t.translatedSubtitle,
      totalChapters: t.totalChapters,
      completedChapters: t.completedChapters,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getById(
    bookId: string,
    translationId: string,
    userId: string,
  ) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const translation = await this.prisma.bookTranslation.findFirst({
      where: { id: translationId, bookId },
      include: {
        chapters: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    return {
      id: translation.id,
      targetLanguage: translation.targetLanguage,
      status: translation.status as unknown as BookTranslationSummary['status'],
      translatedTitle: translation.translatedTitle,
      translatedSubtitle: translation.translatedSubtitle,
      totalChapters: translation.totalChapters,
      completedChapters: translation.completedChapters,
      createdAt: translation.createdAt.toISOString(),
      chapters: translation.chapters.map((ch) => ({
        id: ch.id,
        chapterId: ch.chapterId,
        sequence: ch.sequence,
        translatedTitle: ch.translatedTitle,
        translatedContent: ch.translatedContent,
        status: ch.status,
        createdAt: ch.createdAt.toISOString(),
      })),
    };
  }

  async processChapterTranslation(
    translationId: string,
    data: {
      chapterId: string;
      translatedTitle: string;
      translatedContent: string;
    },
  ): Promise<void> {
    const translation = await this.prisma.bookTranslation.findUnique({
      where: { id: translationId },
      include: { book: { select: { userId: true, title: true } } },
    });

    if (!translation) {
      throw new NotFoundException(`Translation ${translationId} not found`);
    }

    // Update the chapter
    await this.prisma.translationChapter.updateMany({
      where: {
        translationId,
        chapterId: data.chapterId,
      },
      data: {
        translatedTitle: data.translatedTitle,
        translatedContent: data.translatedContent,
        status: TranslationStatus.TRANSLATED,
      },
    });

    // Increment completed chapters
    const updated = await this.prisma.bookTranslation.update({
      where: { id: translationId },
      data: {
        completedChapters: { increment: 1 },
      },
    });

    this.logger.log(
      `Translation ${translationId}: chapter ${data.chapterId} completed (${updated.completedChapters}/${updated.totalChapters})`,
    );

    // Check if all chapters are done
    if (updated.completedChapters >= updated.totalChapters) {
      await this.prisma.bookTranslation.update({
        where: { id: translationId },
        data: { status: TranslationStatus.TRANSLATED },
      });

      await this.notifications.create({
        userId: translation.book.userId,
        type: NotificationType.TRANSLATION_COMPLETED,
        title: 'Translation completed',
        message: `Your book "${translation.book.title}" has been translated to ${translation.targetLanguage}.`,
        data: {
          bookId: translation.bookId,
          translationId: translation.id,
          targetLanguage: translation.targetLanguage,
        },
      });

      this.logger.log(`Translation ${translationId} fully completed`);
    }
  }
}
