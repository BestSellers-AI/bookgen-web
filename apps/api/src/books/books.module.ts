import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { N8nModule } from '../n8n/n8n.module';
import { WalletModule } from '../wallet/wallet.module';
import { GenerationModule } from '../generation/generation.module';
import { BookService } from './book.service';
import { BooksController } from './books.controller';
import { BookEventsListener } from './book-events.listener';

@Module({
  imports: [PrismaModule, N8nModule, WalletModule, GenerationModule],
  controllers: [BooksController],
  providers: [BookService, BookEventsListener],
  exports: [BookService],
})
export class BooksModule {}
