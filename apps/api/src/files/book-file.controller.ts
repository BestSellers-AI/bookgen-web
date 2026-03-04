import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookFileService } from './book-file.service';

@Controller('books/:bookId/files')
@UseGuards(JwtAuthGuard)
export class BookFileController {
  constructor(private readonly bookFileService: BookFileService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.bookFileService.getFilesByBook(bookId, userId);
  }

  @Get(':id/download')
  async download(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Param('id') id: string,
  ) {
    return this.bookFileService.getDownloadUrl(bookId, id, userId);
  }
}
