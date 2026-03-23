import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookService } from './book.service';

@Injectable()
export class BookEventsListener {
  private readonly logger = new Logger(BookEventsListener.name);

  constructor(private readonly bookService: BookService) {}

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
    }
  }
}
