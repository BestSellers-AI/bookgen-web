import { Controller, Param, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SseManager } from './sse-manager';

@Controller('books')
@UseGuards(JwtAuthGuard)
@SkipThrottle()
export class BookSseController {
  constructor(private readonly sseManager: SseManager) {}

  // GET /api/books/:id/events
  @Sse(':id/events')
  events(@Param('id') bookId: string): Observable<MessageEvent> {
    return this.sseManager.subscribe(bookId);
  }
}
