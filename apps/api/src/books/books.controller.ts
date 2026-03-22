import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookService } from './book.service';
import { BookQueryDto, CreateBookDto, UpdatePlanningDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { PaginatedResponse, BookListItem, BookDetail } from '@bestsellers/shared';

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BooksController {
  constructor(private readonly bookService: BookService) {}

  // GET /books
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: BookQueryDto,
  ): Promise<PaginatedResponse<BookListItem>> {
    return this.bookService.findAllByUser(userId, query);
  }

  // GET /books/:id
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<BookDetail> {
    return this.bookService.findById(id, userId);
  }

  // DELETE /books/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.bookService.softDelete(id, userId);
    return { message: 'Book deleted' };
  }

  // POST /books
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookDto,
  ) {
    return this.bookService.create(userId, dto);
  }

  // POST /books/:id/preview — 10 per hour
  @Post(':id/preview')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async requestPreview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.bookService.requestPreview(id, userId);
    return { message: 'Preview generation started' };
  }

  // GET /books/:id/preview-status
  @Get(':id/preview-status')
  async getPreviewStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookService.getPreviewStatus(id, userId);
  }

  // PATCH /books/:id/planning
  @Patch(':id/planning')
  async updatePlanning(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlanningDto,
  ): Promise<BookDetail> {
    return this.bookService.updatePlanning(id, userId, dto);
  }

  // POST /books/:id/approve
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approvePreview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.bookService.approvePreview(id, userId);
    return { message: 'Preview approved' };
  }

  // POST /books/:id/generation-intent
  @Post(':id/generation-intent')
  async createGenerationIntent(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ intentId: string }> {
    return this.bookService.createGenerationIntent(id, userId);
  }

  // POST /books/:id/generate
  @Post(':id/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestGeneration(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.bookService.requestGeneration(id, userId);
    return { message: 'Generation started' };
  }

  // POST /books/:id/chapters/:seq/regenerate
  @Post(':id/chapters/:seq/regenerate')
  @HttpCode(HttpStatus.ACCEPTED)
  async regenerateChapter(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('seq') seq: string,
  ): Promise<{ message: string }> {
    await this.bookService.regenerateChapter(id, +seq, userId);
    return { message: 'Chapter regeneration started' };
  }

  // POST /books/:id/retry
  @Post(':id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  async retryGeneration(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.bookService.retryGeneration(id, userId);
    return { message: 'Generation retry started' };
  }
}
