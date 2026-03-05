import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { N8nClientService } from '../n8n/n8n-client.service';
import {
  BookStatus,
  AddonStatus,
  CreditType,
  WalletTransactionType,
} from '@prisma/client';
import { CREDITS_COST } from '@bestsellers/shared';
import type { BookAddonSummary } from '@bestsellers/shared';
import { RequestAddonDto } from './dto';

@Injectable()
export class AddonService {
  private readonly logger = new Logger(AddonService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly n8nClient: N8nClientService,
  ) {}

  async request(
    userId: string,
    bookId: string,
    dto: RequestAddonDto,
  ): Promise<BookAddonSummary> {
    // Verify book ownership + status
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.GENERATED) {
      throw new BadRequestException(
        'Add-ons can only be requested for fully generated books',
      );
    }

    // Determine credit cost
    const creditsCost = CREDITS_COST[dto.kind];
    if (!creditsCost) {
      throw new BadRequestException(`Unknown addon kind: ${dto.kind}`);
    }

    // Create addon record first (PENDING)
    const addon = await this.prisma.bookAddon.create({
      data: {
        bookId,
        kind: dto.kind,
        status: AddonStatus.PENDING,
        creditsCost,
      },
    });

    // Debit credits (throws 402 if insufficient)
    await this.walletService.debitCredits(
      userId,
      creditsCost,
      WalletTransactionType.ADDON_PURCHASE,
      `Add-on: ${dto.kind}`,
      { bookId, addonId: addon.id },
    );

    // Dispatch to n8n
    try {
      await this.n8nClient.dispatchAddon(bookId, addon.id, dto.kind, {
        ...(dto.params ?? {}),
      });
    } catch {
      // Refund credits and mark addon as ERROR on dispatch failure
      await this.walletService.addCredits(userId, creditsCost, CreditType.REFUND, {
        description: `Refund: ${dto.kind} add-on dispatch failed`,
        transactionType: WalletTransactionType.REFUND,
      });
      await this.prisma.bookAddon.update({
        where: { id: addon.id },
        data: {
          status: AddonStatus.ERROR,
          error: 'Failed to dispatch to processing engine',
        },
      });
      throw new BadRequestException(
        'Failed to start add-on processing. Credits have been refunded.',
      );
    }

    // Update to QUEUED
    const updated = await this.prisma.bookAddon.update({
      where: { id: addon.id },
      data: { status: AddonStatus.QUEUED },
    });

    this.logger.log(
      `Addon ${addon.id} (${dto.kind}) requested for book ${bookId}`,
    );

    return {
      id: updated.id,
      kind: updated.kind as unknown as BookAddonSummary['kind'],
      status: updated.status as unknown as BookAddonSummary['status'],
      resultUrl: updated.resultUrl,
      resultData: updated.resultData as Record<string, unknown> | null,
      creditsCost: updated.creditsCost,
      error: updated.error,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async findAllByBook(
    bookId: string,
    userId: string,
  ): Promise<BookAddonSummary[]> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const addons = await this.prisma.bookAddon.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });

    return addons.map((a) => ({
      id: a.id,
      kind: a.kind as unknown as BookAddonSummary['kind'],
      status: a.status as unknown as BookAddonSummary['status'],
      resultUrl: a.resultUrl,
      resultData: a.resultData as Record<string, unknown> | null,
      creditsCost: a.creditsCost,
      error: a.error,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  async findById(
    bookId: string,
    addonId: string,
    userId: string,
  ): Promise<BookAddonSummary> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const addon = await this.prisma.bookAddon.findFirst({
      where: { id: addonId, bookId },
    });

    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }

    return {
      id: addon.id,
      kind: addon.kind as unknown as BookAddonSummary['kind'],
      status: addon.status as unknown as BookAddonSummary['status'],
      resultUrl: addon.resultUrl,
      resultData: addon.resultData as Record<string, unknown> | null,
      creditsCost: addon.creditsCost,
      error: addon.error,
      createdAt: addon.createdAt.toISOString(),
      updatedAt: addon.updatedAt.toISOString(),
    };
  }

  async cancel(
    bookId: string,
    addonId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const addon = await this.prisma.bookAddon.findFirst({
      where: { id: addonId, bookId },
    });

    if (!addon) {
      throw new NotFoundException('Add-on not found');
    }

    const cancellableStatuses: AddonStatus[] = [AddonStatus.PENDING, AddonStatus.QUEUED];
    if (!cancellableStatuses.includes(addon.status)) {
      throw new BadRequestException(
        `Cannot cancel add-on with status: ${addon.status}`,
      );
    }

    // Refund credits
    if (addon.creditsCost && addon.creditsCost > 0) {
      await this.walletService.addCredits(userId, addon.creditsCost, CreditType.REFUND, {
        description: `Refund: ${addon.kind} add-on cancelled`,
        transactionType: WalletTransactionType.REFUND,
      });
    }

    await this.prisma.bookAddon.update({
      where: { id: addonId },
      data: { status: AddonStatus.CANCELLED },
    });

    this.logger.log(`Addon ${addonId} cancelled for book ${bookId}`);

    return { message: 'Add-on cancelled and credits refunded' };
  }
}
