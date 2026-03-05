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
import { AdminService } from './admin.service';
import {
  AdminPaginationDto,
  AdminAddCreditsDto,
  AdminChangeRoleDto,
} from './dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ── Users ───────────────────────────────────────────────────────── */

  @Get('users')
  async getUsers(@Query() query: AdminPaginationDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  async changeUserRole(
    @Param('id') id: string,
    @CurrentUser('id') callerId: string,
    @Body() dto: AdminChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(id, callerId, dto);
  }

  @Post('users/:id/add-credits')
  async addCredits(
    @Param('id') id: string,
    @Body() dto: AdminAddCreditsDto,
  ) {
    return this.adminService.addCredits(id, dto);
  }

  /* ── Books ───────────────────────────────────────────────────────── */

  @Get('books')
  async getBooks(@Query() query: AdminPaginationDto) {
    return this.adminService.getBooks(query);
  }

  @Get('books/:id')
  async getBookById(@Param('id') id: string) {
    return this.adminService.getBookById(id);
  }

  /* ── Subscriptions ───────────────────────────────────────────────── */

  @Get('subscriptions')
  async getSubscriptions(@Query() query: AdminPaginationDto) {
    return this.adminService.getSubscriptions(query);
  }

  /* ── Purchases ───────────────────────────────────────────────────── */

  @Get('purchases')
  async getPurchases(@Query() query: AdminPaginationDto) {
    return this.adminService.getPurchases(query);
  }

  /* ── Stats ───────────────────────────────────────────────────────── */

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
