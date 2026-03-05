import {
  Controller,
  Param,
  Sse,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SseManager } from './sse-manager';

@Controller('books')
@UseGuards(JwtAuthGuard)
@SkipThrottle()
export class BookSseController {
  constructor(
    private readonly sseManager: SseManager,
    private readonly prisma: PrismaService,
  ) {}

  // GET /api/books/:id/events
  @Sse(':id/events')
  async events(
    @Param('id') bookId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Observable<MessageEvent>> {
    // Verify book ownership before subscribing
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return this.sseManager.subscribe(bookId);
  }
}
