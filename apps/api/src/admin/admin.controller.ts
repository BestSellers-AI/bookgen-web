import {
  Controller,
  Get,
  Put,
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
  AdminAssignPlanDto,
  UpdateProductDto,
  CreatePriceDto,
  UpdateAppConfigDto,
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

  @Put('users/:id/plan')
  async assignPlan(
    @Param('id') id: string,
    @CurrentUser('id') callerId: string,
    @Body() dto: AdminAssignPlanDto,
  ) {
    return this.adminService.assignPlan(id, dto, callerId);
  }

  @Patch('users/:id/plan/remove')
  async removePlan(
    @Param('id') id: string,
    @CurrentUser('id') callerId: string,
  ) {
    return this.adminService.removePlan(id, callerId);
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

  /* ── Products ─────────────────────────────────────────────────────── */

  @Get('products')
  async listProducts() {
    return this.adminService.listProducts();
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Post('products/:id/prices')
  async addProductPrice(
    @Param('id') id: string,
    @Body() dto: CreatePriceDto,
  ) {
    return this.adminService.addProductPrice(id, dto);
  }

  @Patch('products/:id/prices/:priceId/deactivate')
  async deactivatePrice(
    @Param('id') id: string,
    @Param('priceId') priceId: string,
  ) {
    return this.adminService.deactivatePrice(id, priceId);
  }

  /* ── App Config ───────────────────────────────────────────────────── */

  @Get('config')
  async getAppConfigs() {
    return this.adminService.getAppConfigs();
  }

  @Put('config/:key')
  async updateAppConfig(
    @Param('key') key: string,
    @Body() dto: UpdateAppConfigDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.adminService.updateAppConfig(key, dto.value, userId);
  }
}
