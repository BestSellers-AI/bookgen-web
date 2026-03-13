import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreditLedgerService } from '../wallet/credit-ledger.service';
import { NotificationService } from '../notifications/notification.service';
import { AddonStatus, BookStatus, NotificationType } from '@prisma/client';

/** Configurable thresholds (can be moved to ConfigDataService later) */
const NOTIFICATION_RETENTION_DAYS = 90;
const STUCK_BOOK_THRESHOLD_MS = 45 * 60 * 1000;   // 45 minutes
const STUCK_ADDON_THRESHOLD_MS = 30 * 60 * 1000;   // 30 minutes

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly notifications: NotificationService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Expire Credits — daily at 00:00 UTC                                */
  /* ------------------------------------------------------------------ */
  @Cron('0 0 * * *', { name: 'expireCredits', timeZone: 'UTC' })
  async expireCredits() {
    this.logger.log('Cron: expireCredits started');

    const result = await this.creditLedgerService.expireCredits();

    if (result.expired > 0) {
      // Find userId for each affected wallet and notify
      const wallets = await this.prisma.wallet.findMany({
        where: { id: { in: result.affectedWalletIds } },
        select: { id: true, userId: true },
      });

      const results = await Promise.allSettled(
        wallets.map((w) =>
          this.notifications.create({
            userId: w.userId,
            type: NotificationType.CREDITS_EXPIRING,
            title: 'Credits expired',
            message: 'Some of your credits have expired.',
            data: { walletId: w.id },
          }),
        ),
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        this.logger.warn(`Failed to send ${failed.length} expiry notifications`);
      }
    }

    this.logger.log(
      `Cron: expireCredits completed — ${result.expired} credits expired, ${result.affectedWalletIds.length} wallets affected`,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Clean Expired Sessions — daily at 01:00 UTC                        */
  /* ------------------------------------------------------------------ */
  @Cron('0 1 * * *', { name: 'cleanExpiredSessions', timeZone: 'UTC' })
  async cleanExpiredSessions() {
    this.logger.log('Cron: cleanExpiredSessions started');

    const count = await this.authService.cleanExpiredSessions();

    this.logger.log(
      `Cron: cleanExpiredSessions completed — ${count} sessions cleaned`,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Clean Old Notifications — weekly, Sunday at 02:00 UTC              */
  /* ------------------------------------------------------------------ */
  @Cron('0 2 * * 0', { name: 'cleanOldNotifications', timeZone: 'UTC' })
  async cleanOldNotifications() {
    this.logger.log('Cron: cleanOldNotifications started');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - NOTIFICATION_RETENTION_DAYS);

    const result = await this.prisma.notification.deleteMany({
      where: {
        readAt: { not: null },
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    this.logger.log(
      `Cron: cleanOldNotifications completed — ${result.count} old notifications deleted`,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Sync Wallet Balances — daily at 03:00 UTC                          */
  /* ------------------------------------------------------------------ */
  @Cron('0 3 * * *', { name: 'syncWalletBalances', timeZone: 'UTC' })
  async syncWalletBalances() {
    this.logger.log('Cron: syncWalletBalances started');

    const wallets = await this.prisma.wallet.findMany({
      select: { id: true },
    });

    let synced = 0;
    let errors = 0;
    for (const wallet of wallets) {
      try {
        await this.creditLedgerService.syncWalletBalance(wallet.id);
        synced++;
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to sync wallet ${wallet.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log(
      `Cron: syncWalletBalances completed — ${synced} synced, ${errors} errors`,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Recover Stuck Generations — every 10 minutes                       */
  /* ------------------------------------------------------------------ */
  @Cron('*/10 * * * *', { name: 'recoverStuckGenerations', timeZone: 'UTC' })
  async recoverStuckGenerations() {
    const stuckThreshold = new Date(Date.now() - STUCK_BOOK_THRESHOLD_MS);

    const stuckBooks = await this.prisma.book.findMany({
      where: {
        status: {
          in: [
            BookStatus.GENERATING,
            BookStatus.QUEUED,
            BookStatus.PREVIEW_GENERATING,
            BookStatus.PREVIEW_COMPLETING,
          ],
        },
        updatedAt: { lt: stuckThreshold },
        deletedAt: null,
      },
      select: { id: true, userId: true, status: true, title: true },
    });

    if (stuckBooks.length === 0) return;

    this.logger.warn(
      `Cron: recoverStuckGenerations — found ${stuckBooks.length} stuck books`,
    );

    for (const book of stuckBooks) {
      try {
        await this.prisma.book.updateMany({
          where: { id: book.id, status: book.status },
          data: {
            status: BookStatus.ERROR,
            generationError: `Generation timed out (stuck in ${book.status} for over ${STUCK_BOOK_THRESHOLD_MS / 60_000} minutes). Please try again.`,
          },
        });

        await this.notifications.create({
          userId: book.userId,
          type: NotificationType.BOOK_GENERATION_ERROR,
          title: 'Generation timed out',
          message: `"${book.title}" was stuck and has been marked as failed. You can retry.`,
          data: { bookId: book.id },
        });

        this.logger.log(`Recovered stuck book ${book.id} (was ${book.status})`);
      } catch (error) {
        this.logger.error(
          `Failed to recover stuck book ${book.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Also recover stuck addons
    const addonThreshold = new Date(Date.now() - STUCK_ADDON_THRESHOLD_MS);

    const stuckAddons = await this.prisma.bookAddon.findMany({
      where: {
        status: { in: [AddonStatus.PENDING, AddonStatus.QUEUED] },
        updatedAt: { lt: addonThreshold },
      },
      include: { book: { select: { userId: true } } },
    });

    for (const addon of stuckAddons) {
      try {
        await this.prisma.bookAddon.updateMany({
          where: { id: addon.id, status: addon.status },
          data: {
            status: AddonStatus.ERROR,
            error: `Add-on timed out (stuck in ${addon.status} for over ${STUCK_ADDON_THRESHOLD_MS / 60_000} minutes).`,
          },
        });

        await this.notifications.create({
          userId: addon.book.userId,
          type: NotificationType.ADDON_COMPLETED,
          title: 'Add-on failed',
          message: `Add-on ${addon.kind} timed out. You can retry.`,
          data: { bookId: addon.bookId, addonId: addon.id },
        });

        this.logger.log(`Recovered stuck addon ${addon.id} (was ${addon.status})`);
      } catch (error) {
        this.logger.error(
          `Failed to recover stuck addon ${addon.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (stuckAddons.length > 0) {
      this.logger.warn(
        `Cron: recoverStuckGenerations — recovered ${stuckAddons.length} stuck addons`,
      );
    }
  }
}
