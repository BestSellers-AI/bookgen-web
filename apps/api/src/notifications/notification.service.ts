import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationItem, PaginatedResponse } from '@bestsellers/shared';
import { paginate, buildPaginatedResponse } from '../common/utils/paginate';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification for a user. Used internally by other modules.
   */
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationItem> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: (params.data ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });

    return {
      id: notification.id,
      type: notification.type as unknown as NotificationItem['type'],
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, unknown> | null,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Get paginated notifications for a user, optionally filtered to unread only.
   */
  async findAllByUser(
    userId: string,
    query: { page?: number; perPage?: number; unreadOnly?: boolean },
  ): Promise<PaginatedResponse<NotificationItem>> {
    const { page = 1, perPage = 20 } = query;

    const where: Record<string, unknown> = { userId };
    if (query.unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
      }),
      this.prisma.notification.count({ where }),
    ]);

    const data: NotificationItem[] = notifications.map((n) => ({
      id: n.id,
      type: n.type as unknown as NotificationItem['type'],
      title: n.title,
      message: n.message,
      data: n.data as Record<string, unknown> | null,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  /**
   * Get the count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  /**
   * Mark a single notification as read. No-op if already read.
   */
  async markAsRead(id: string, userId: string): Promise<NotificationItem> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // If already read, return as-is (no-op)
    if (notification.readAt) {
      return {
        id: notification.id,
        type: notification.type as unknown as NotificationItem['type'],
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | null,
        readAt: notification.readAt.toISOString(),
        createdAt: notification.createdAt.toISOString(),
      };
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return {
      id: updated.id,
      type: updated.type as unknown as NotificationItem['type'],
      title: updated.title,
      message: updated.message,
      data: updated.data as Record<string, unknown> | null,
      readAt: updated.readAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Mark all unread notifications as read for a user. Returns the count updated.
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return result.count;
  }
}
