import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreditLedgerService } from '../wallet/credit-ledger.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '@prisma/client';

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

      await Promise.all(
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
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

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
    for (const wallet of wallets) {
      await this.creditLedgerService.syncWalletBalance(wallet.id);
      synced++;
    }

    this.logger.log(
      `Cron: syncWalletBalances completed — ${synced} wallets synced`,
    );
  }
}
