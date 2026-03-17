import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PublishingStatus,
  NotificationType,
  AddonStatus,
} from '@prisma/client';
import {
  PublishingQueryDto,
  UpdatePublishingStatusDto,
  CompletePublishingDto,
} from './dto';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /* ── User endpoints ─────────────────────────────────────────────── */

  async getByBook(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return this.prisma.publishingRequest.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(bookId: string, id: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const request = await this.prisma.publishingRequest.findFirst({
      where: { id, bookId },
    });

    if (!request) {
      throw new NotFoundException('Publishing request not found');
    }

    return request;
  }

  /* ── Admin endpoints ────────────────────────────────────────────── */

  async listAll(query: PublishingQueryDto) {
    const { page = 1, perPage = 20, search, status } = query;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { book: { title: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.publishingRequest.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: { id: true, title: true, author: true } },
          user: { select: { id: true, email: true, name: true } },
          addon: { select: { id: true, kind: true, status: true } },
          translation: {
            select: { id: true, targetLanguage: true, status: true },
          },
        },
      }),
      this.prisma.publishingRequest.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getDetail(id: string) {
    const request = await this.prisma.publishingRequest.findUnique({
      where: { id },
      include: {
        book: {
          include: {
            files: true,
            images: true,
            chapters: { orderBy: { sequence: 'asc' } },
            audiobooks: { include: { chapters: true } },
            translations: true,
          },
        },
        addon: {
          select: { id: true, kind: true, status: true, creditsCost: true },
        },
        translation: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Publishing request not found');
    }

    return request;
  }

  async updateStatus(id: string, dto: UpdatePublishingStatusDto) {
    const request = await this.prisma.publishingRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, bookId: true, addonId: true },
    });

    if (!request) {
      throw new NotFoundException('Publishing request not found');
    }

    const updated = await this.prisma.publishingRequest.update({
      where: { id },
      data: { status: dto.status },
    });

    // If published, also mark the parent addon as COMPLETED
    if (dto.status === PublishingStatus.PUBLISHED) {
      await this.prisma.bookAddon.update({
        where: { id: request.addonId },
        data: { status: AddonStatus.COMPLETED },
      });
    }

    // Create notification for the user
    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: NotificationType.PUBLISHING_UPDATE,
        title: 'Publishing Update',
        message: `Your publishing request status has been updated to ${dto.status}.`,
        data: {
          bookId: request.bookId,
          publishingRequestId: id,
          status: dto.status,
        },
      },
    });

    this.logger.log(
      `Publishing request ${id} status updated to ${dto.status}`,
    );

    return updated;
  }

  async complete(id: string, dto: CompletePublishingDto) {
    const request = await this.prisma.publishingRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, bookId: true, addonId: true },
    });

    if (!request) {
      throw new NotFoundException('Publishing request not found');
    }

    const updated = await this.prisma.publishingRequest.update({
      where: { id },
      data: {
        status: PublishingStatus.PUBLISHED,
        publishedUrl: dto.publishedUrl,
        amazonAsin: dto.amazonAsin,
        kdpUrl: dto.kdpUrl,
        adminNotes: dto.adminNotes,
        publishedAt: new Date(),
      },
    });

    // Mark parent addon as COMPLETED
    await this.prisma.bookAddon.update({
      where: { id: request.addonId },
      data: { status: AddonStatus.COMPLETED },
    });

    // Create notification for the user
    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: NotificationType.PUBLISHING_UPDATE,
        title: 'Book Published!',
        message: 'Your book has been published successfully.',
        data: {
          bookId: request.bookId,
          publishingRequestId: id,
          status: PublishingStatus.PUBLISHED,
          publishedUrl: dto.publishedUrl,
          amazonAsin: dto.amazonAsin,
        },
      },
    });

    this.logger.log(`Publishing request ${id} completed (published)`);

    return updated;
  }
}
