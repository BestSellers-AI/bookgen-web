import { Global, Module } from '@nestjs/common';
import { SseManager } from './sse-manager';
import { BookSseController } from './book-sse.controller';
import { SseEventsListener } from './sse-events.listener';

@Global()
@Module({
  controllers: [BookSseController],
  providers: [SseManager, SseEventsListener],
  exports: [SseManager],
})
export class SseModule {}
