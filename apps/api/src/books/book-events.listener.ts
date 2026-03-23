import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { BookService } from './book.service';

@Injectable()
export class BookEventsListener {
  private readonly logger = new Logger(BookEventsListener.name);

  constructor(
    private readonly bookService: BookService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('book.auto-approve')
  async handleAutoApprove(payload: { bookId: string; userId: string }) {
    this.logger.log(`Auto-approving preview for book ${payload.bookId}`);
    try {
      await this.bookService.approvePreview(payload.bookId, payload.userId);
      this.logger.log(`Auto-approve completed for book ${payload.bookId}`);
    } catch (error) {
      this.logger.error(
        `Auto-approve failed for book ${payload.bookId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Fallback: notify user manually so they don't see infinite loading
      const book = await this.prisma.book.findUnique({
        where: { id: payload.bookId },
        select: { title: true },
      });

      this.eventEmitter.emit('book.preview.progress', {
        bookId: payload.bookId,
        status: 'ready',
      });

      await this.notifications.create({
        userId: payload.userId,
        type: NotificationType.BOOK_PREVIEW_READY,
        title: 'Preview ready',
        message: `Your book preview "${book?.title ?? 'your book'}" is ready for review.`,
        data: { bookId: payload.bookId },
      });
    }
  }
}
