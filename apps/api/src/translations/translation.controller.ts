import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TranslationService } from './translation.service';

@Controller('books/:bookId/translations')
@UseGuards(JwtAuthGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.translationService.getByBook(bookId, userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Param('id') id: string,
  ) {
    return this.translationService.getById(bookId, id, userId);
  }
}
