import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ShareService } from './share.service';

@Controller()
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('books/:bookId/share')
  @UseGuards(JwtAuthGuard)
  async createShare(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Body() body?: { translationId?: string },
  ) {
    return this.shareService.createShareLink(bookId, userId, body?.translationId);
  }

  @Delete('books/:bookId/share/:id')
  @UseGuards(JwtAuthGuard)
  async deactivateShare(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Param('id') id: string,
  ) {
    return this.shareService.deactivateShareLink(bookId, id, userId);
  }

  @Get('books/:bookId/share')
  @UseGuards(JwtAuthGuard)
  async getShare(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.shareService.getShareByBook(bookId, userId);
  }

  @Get('share/:token')
  @Public()
  async getPublicBook(@Param('token') token: string) {
    return this.shareService.getPublicBook(token);
  }
}
