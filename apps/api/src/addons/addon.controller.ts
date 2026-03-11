import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddonService } from './addon.service';
import { RequestAddonDto } from './dto';

@Controller('books/:bookId/addons')
@UseGuards(JwtAuthGuard)
export class AddonController {
  constructor(private readonly addonService: AddonService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async request(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Body() dto: RequestAddonDto,
  ) {
    return this.addonService.request(userId, bookId, dto);
  }

  @Post('bundle/:bundleId')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestBundle(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Param('bundleId') bundleId: string,
  ) {
    return this.addonService.requestBundle(userId, bookId, bundleId);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.addonService.findAllByBook(bookId, userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Param('id') id: string,
  ) {
    return this.addonService.findById(bookId, id, userId);
  }

  @Delete(':id')
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Param('id') id: string,
  ) {
    return this.addonService.cancel(bookId, id, userId);
  }
}
