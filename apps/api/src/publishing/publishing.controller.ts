import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PublishingService } from './publishing.service';
import {
  PublishingQueryDto,
  UpdatePublishingStatusDto,
  CompletePublishingDto,
} from './dto';

/* ── User-facing endpoints ────────────────────────────────────────── */

@Controller('books')
@UseGuards(JwtAuthGuard)
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Get(':bookId/publishing')
  async getByBook(
    @Param('bookId') bookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.publishingService.getByBook(bookId, userId);
  }

  @Get(':bookId/publishing/:id')
  async getById(
    @Param('bookId') bookId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.publishingService.getById(bookId, id, userId);
  }
}

/* ── Admin endpoints ──────────────────────────────────────────────── */

@Controller('admin/publishing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Get()
  async listAll(@Query() query: PublishingQueryDto) {
    return this.publishingService.listAll(query);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return this.publishingService.getDetail(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePublishingStatusDto,
  ) {
    return this.publishingService.updateStatus(id, dto);
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompletePublishingDto,
  ) {
    return this.publishingService.complete(id, dto);
  }
}
