import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto';
import { PaginatedResponse, NotificationItem } from '@bestsellers/shared';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginatedResponse<NotificationItem>> {
    return this.notificationService.findAllByUser(userId, {
      page: query.page,
      perPage: query.perPage,
      unreadOnly: query.unreadOnly,
    });
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser('id') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.notificationService.markAsRead(id, userId);
    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  async markAllAsRead(
    @CurrentUser('id') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationService.markAllAsRead(userId);
    return { count };
  }
}
