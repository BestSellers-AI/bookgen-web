import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreditLedgerService } from '../wallet/credit-ledger.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../email/email.service';
import { AppConfigService } from '../config/app-config.service';
import { creditsExpiringEmail, monthlySummaryEmail, purchaseRecoveryEmail, bookRecoveryEmail } from '../email/email-templates';
import { AddonStatus, BookStatus, NotificationType, WalletTransactionType, type Prisma } from '@prisma/client';

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
    private readonly emailService: EmailService,
    private readonly appConfig: AppConfigService,
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

  /* ------------------------------------------------------------------ */
  /*  Credits Expiring Warning — daily at 06:00 UTC                      */
  /* ------------------------------------------------------------------ */
  @Cron('0 6 * * *', { name: 'creditsExpiringWarning', timeZone: 'UTC' })
  async creditsExpiringWarning() {
    this.logger.log('Cron: creditsExpiringWarning started');

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const now = new Date();

    // Find credit ledger entries expiring in the next 7 days with remaining > 0
    const expiringEntries = await this.prisma.creditLedger.findMany({
      where: {
        expiresAt: { gte: now, lte: sevenDaysFromNow },
        remaining: { gt: 0 },
      },
      select: { walletId: true, remaining: true, expiresAt: true },
    });

    if (expiringEntries.length === 0) {
      this.logger.log('Cron: creditsExpiringWarning — no expiring credits found');
      return;
    }

    // Group by walletId
    const byWallet = new Map<string, { total: number; earliestExpiry: Date }>();
    for (const entry of expiringEntries) {
      const existing = byWallet.get(entry.walletId);
      if (existing) {
        existing.total += entry.remaining;
        if (entry.expiresAt! < existing.earliestExpiry) {
          existing.earliestExpiry = entry.expiresAt!;
        }
      } else {
        byWallet.set(entry.walletId, { total: entry.remaining, earliestExpiry: entry.expiresAt! });
      }
    }

    // Get user info for each wallet
    const wallets = await this.prisma.wallet.findMany({
      where: { id: { in: [...byWallet.keys()] } },
      select: { id: true, userId: true },
    });

    let sent = 0;
    for (const wallet of wallets) {
      const info = byWallet.get(wallet.id);
      if (!info) continue;

      try {
        const user = await this.prisma.user.findUnique({
          where: { id: wallet.userId },
          select: { email: true, name: true, locale: true },
        });
        if (!user) continue;

        const email = creditsExpiringEmail({
          userName: user.name ?? 'there',
          credits: info.total,
          expiryDate: info.earliestExpiry.toLocaleDateString(),
          dashboardUrl: `${this.appConfig.frontendUrl}/dashboard`,
          locale: user.locale,
        });
        this.emailService.send({ to: user.email, subject: email.subject, html: email.html });
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send expiring credits email for wallet ${wallet.id}: ${error}`);
      }
    }

    this.logger.log(`Cron: creditsExpiringWarning completed — ${sent} emails sent`);
  }

  /* ------------------------------------------------------------------ */
  /*  Monthly Summary — 1st of each month at 08:00 UTC                   */
  /* ------------------------------------------------------------------ */
  @Cron('0 8 1 * *', { name: 'monthlySummary', timeZone: 'UTC' })
  async sendMonthlySummary() {
    this.logger.log('Cron: monthlySummary started');

    // Calculate previous month range
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const monthName = startOfLastMonth.toLocaleString('en', { month: 'long', year: 'numeric' });

    // Find users with any activity last month (books created or credits used)
    const activeUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { books: { some: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, deletedAt: null } } },
          { wallet: { transactions: { some: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } } } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        books: {
          where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, deletedAt: null },
          select: { id: true },
        },
        wallet: {
          select: {
            balance: true,
            transactions: {
              where: {
                createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                type: { in: [WalletTransactionType.BOOK_GENERATION, WalletTransactionType.ADDON_PURCHASE] },
              },
              select: { amount: true },
            },
          },
        },
      },
    });

    let sent = 0;
    for (const user of activeUsers) {
      try {
        const booksCreated = user.books.length;
        const creditsUsed = user.wallet?.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;
        const creditsRemaining = user.wallet?.balance ?? 0;

        if (booksCreated === 0 && creditsUsed === 0) continue;

        const email = monthlySummaryEmail({
          userName: user.name ?? 'there',
          month: monthName,
          booksCreated,
          creditsUsed,
          creditsRemaining,
          dashboardUrl: `${this.appConfig.frontendUrl}/dashboard`,
          locale: user.locale,
        });
        this.emailService.send({ to: user.email, subject: email.subject, html: email.html });
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send monthly summary for user ${user.id}: ${error}`);
      }
    }

    this.logger.log(`Cron: monthlySummary completed — ${sent} emails sent`);
  }

  // ─── Purchase Abandonment Recovery ─────────────────────────────────────────
  // Runs every 10 minutes. Finds intents created 10min–24h ago that weren't
  // converted and haven't received a recovery email yet.

  @Cron('*/10 * * * *') // every 10 minutes
  async purchaseAbandonmentRecovery() {
    this.logger.log('Cron: purchaseAbandonmentRecovery starting');

    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const abandonedIntents = await this.prisma.purchaseIntent.findMany({
      where: {
        converted: false,
        recoveryEmailSentAt: null,
        createdAt: {
          gte: twentyFourHoursAgo,
          lte: tenMinAgo,
        },
      },
      include: {
        user: { select: { id: true, email: true, name: true, locale: true } },
      },
      take: 100,
    });

    if (abandonedIntents.length === 0) {
      this.logger.log('Cron: purchaseAbandonmentRecovery — no abandoned intents found');
      return;
    }

    // Resolve product names from slugs
    const slugs = [...new Set(abandonedIntents.map((i) => i.productSlug))];
    const products = await this.prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, name: true },
    });
    const productNameMap = new Map(products.map((p) => [p.slug, p.name]));

    let sent = 0;
    for (const intent of abandonedIntents) {
      try {
        const recipientEmail = intent.user?.email ?? intent.email;
        if (!recipientEmail) continue;

        const locale = intent.user?.locale ?? 'en';
        const pricingUrl = intent.type === 'subscription'
          ? `${this.appConfig.frontendUrl}/dashboard/upgrade`
          : `${this.appConfig.frontendUrl}/dashboard/upgrade?tab=credits`;

        const productName = productNameMap.get(intent.productSlug) ?? intent.productSlug;

        const email = purchaseRecoveryEmail({
          userName: intent.user?.name ?? 'there',
          type: intent.type as 'subscription' | 'credit_pack',
          productName,
          pricingUrl,
          locale,
        });

        this.emailService.send({
          to: recipientEmail,
          subject: email.subject,
          html: email.html,
        });

        await this.prisma.purchaseIntent.update({
          where: { id: intent.id },
          data: { recoveryEmailSentAt: new Date() },
        });

        sent++;
      } catch (error) {
        this.logger.error(`Failed to send recovery email for intent ${intent.id}: ${error}`);
      }
    }

    this.logger.log(`Cron: purchaseAbandonmentRecovery completed — ${sent} emails sent`);
  }

  // ─── Book Abandonment Recovery ─────────────────────────────────────────────
  // Runs daily at 09:00 UTC. Finds books in PREVIEW or PREVIEW_COMPLETED
  // status for 24h+ that haven't received a recovery email yet.

  @Cron('0 9 * * *') // daily at 09:00 UTC
  async bookAbandonmentRecovery() {
    this.logger.log('Cron: bookAbandonmentRecovery starting');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abandonedBooks = await this.prisma.book.findMany({
      where: {
        status: { in: [BookStatus.PREVIEW, BookStatus.PREVIEW_COMPLETED] },
        recoveryEmailSentAt: null,
        deletedAt: null,
        updatedAt: { lte: twentyFourHoursAgo },
      },
      include: {
        user: { select: { id: true, email: true, name: true, locale: true } },
      },
      take: 100,
    });

    if (abandonedBooks.length === 0) {
      this.logger.log('Cron: bookAbandonmentRecovery — no abandoned books found');
      return;
    }

    let sent = 0;
    for (const book of abandonedBooks) {
      try {
        if (!book.user?.email) continue;

        const bookUrl = `${this.appConfig.frontendUrl}/dashboard/books/${book.id}`;

        const email = bookRecoveryEmail({
          userName: book.user.name ?? 'there',
          bookTitle: book.title,
          bookUrl,
          status: book.status as 'PREVIEW' | 'PREVIEW_COMPLETED',
          locale: book.user.locale,
        });

        this.emailService.send({
          to: book.user.email,
          subject: email.subject,
          html: email.html,
        });

        await this.prisma.book.update({
          where: { id: book.id },
          data: { recoveryEmailSentAt: new Date() },
        });

        sent++;
      } catch (error) {
        this.logger.error(`Failed to send book recovery email for book ${book.id}: ${error}`);
      }
    }

    this.logger.log(`Cron: bookAbandonmentRecovery completed — ${sent} emails sent`);
  }
}
