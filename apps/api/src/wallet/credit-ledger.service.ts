import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditType, Prisma, WalletTransactionType } from '@prisma/client';
import { WalletBreakdown, ExpiringCredits } from '@bestsellers/shared';
import { InsufficientCreditsException } from './exceptions/insufficient-credits.exception';

@Injectable()
export class CreditLedgerService {
  private readonly logger = new Logger(CreditLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add credits to a wallet by creating a CreditLedger entry.
   */
  async addCredits(
    walletId: string,
    params: {
      amount: number;
      type: CreditType;
      expiresAt?: Date;
      source?: string;
      sourceId?: string;
    },
  ): Promise<void> {
    await this.prisma.creditLedger.create({
      data: {
        walletId,
        type: params.type,
        amount: params.amount,
        remaining: params.amount,
        expiresAt: params.expiresAt ?? null,
        source: params.source ?? null,
        sourceId: params.sourceId ?? null,
      },
    });

    await this.syncWalletBalance(walletId);
    this.logger.log(`Added ${params.amount} credits (${params.type}) to wallet ${walletId}`);
  }

  /**
   * Debit credits from a wallet using FIFO consumption with pessimistic locking.
   */
  async debitCredits(walletId: string, amount: number): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // 1. Lock the wallet row
        await tx.$queryRawUnsafe(
          `SELECT * FROM wallets WHERE id = $1 FOR UPDATE`,
          walletId,
        );

        // 2. Get the real balance from ledger
        const balanceResult = await tx.$queryRawUnsafe<{ sum: number | null }[]>(
          `SELECT COALESCE(SUM(remaining), 0) as sum FROM credit_ledger
           WHERE wallet_id = $1 AND remaining > 0
           AND (expires_at IS NULL OR expires_at > NOW())`,
          walletId,
        );
        const balance = Number(balanceResult[0]?.sum ?? 0);

        // 3. Check if enough credits
        if (balance < amount) {
          throw new InsufficientCreditsException(amount, balance);
        }

        // 4. Get entries with remaining > 0, ordered FIFO (expiring first)
        const entries = await tx.creditLedger.findMany({
          where: {
            walletId,
            remaining: { gt: 0 },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          orderBy: [
            { expiresAt: { sort: 'asc', nulls: 'last' } },
            { createdAt: 'asc' },
          ],
        });

        // 5. FIFO consumption
        let remainingToDebit = amount;
        for (const entry of entries) {
          if (remainingToDebit <= 0) break;

          const deduction = Math.min(entry.remaining, remainingToDebit);
          await tx.creditLedger.update({
            where: { id: entry.id },
            data: { remaining: entry.remaining - deduction },
          });
          remainingToDebit -= deduction;
        }

        // 6. Sync wallet balance inside the transaction
        await this.syncWalletBalance(walletId, tx);
        this.logger.log(`Debited ${amount} credits from wallet ${walletId}`);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * Debit credits and create a WalletTransaction atomically inside one transaction.
   */
  async debitCreditsWithTransaction(
    walletId: string,
    amount: number,
    txData: {
      type: WalletTransactionType;
      description: string;
      bookId?: string | null;
      addonId?: string | null;
    },
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // 1. Lock the wallet row
        await tx.$queryRawUnsafe(
          `SELECT * FROM wallets WHERE id = $1 FOR UPDATE`,
          walletId,
        );

        // 2. Get the real balance from ledger
        const balanceResult = await tx.$queryRawUnsafe<{ sum: number | null }[]>(
          `SELECT COALESCE(SUM(remaining), 0) as sum FROM credit_ledger
           WHERE wallet_id = $1 AND remaining > 0
           AND (expires_at IS NULL OR expires_at > NOW())`,
          walletId,
        );
        const balance = Number(balanceResult[0]?.sum ?? 0);

        // 3. Check if enough credits
        if (balance < amount) {
          throw new InsufficientCreditsException(amount, balance);
        }

        // 4. Get entries with remaining > 0, ordered FIFO (expiring first)
        const entries = await tx.creditLedger.findMany({
          where: {
            walletId,
            remaining: { gt: 0 },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          orderBy: [
            { expiresAt: { sort: 'asc', nulls: 'last' } },
            { createdAt: 'asc' },
          ],
        });

        // 5. FIFO consumption
        let remainingToDebit = amount;
        for (const entry of entries) {
          if (remainingToDebit <= 0) break;

          const deduction = Math.min(entry.remaining, remainingToDebit);
          await tx.creditLedger.update({
            where: { id: entry.id },
            data: { remaining: entry.remaining - deduction },
          });
          remainingToDebit -= deduction;
        }

        // 6. Sync wallet balance inside the transaction
        await this.syncWalletBalance(walletId, tx);

        // 7. Compute current balance for the transaction record
        const postResult = await tx.creditLedger.aggregate({
          where: {
            walletId,
            remaining: { gt: 0 },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          _sum: { remaining: true },
        });
        const currentBalance = postResult._sum.remaining ?? 0;

        // 8. Create WalletTransaction inside the same transaction
        await tx.walletTransaction.create({
          data: {
            walletId,
            type: txData.type,
            amount: -amount,
            balance: currentBalance,
            description: txData.description,
            bookId: txData.bookId ?? null,
            addonId: txData.addonId ?? null,
          },
        });

        this.logger.log(`Debited ${amount} credits from wallet ${walletId}`);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * Get the current balance of a wallet (sum of non-expired remaining credits).
   */
  async getBalance(walletId: string): Promise<number> {
    const result = await this.prisma.creditLedger.aggregate({
      where: {
        walletId,
        remaining: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _sum: { remaining: true },
    });

    return result._sum.remaining ?? 0;
  }

  /**
   * Get the balance breakdown by credit type.
   */
  async getBreakdown(walletId: string): Promise<WalletBreakdown> {
    const now = new Date();
    const baseWhere = {
      walletId,
      remaining: { gt: 0 },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    const [subscription, purchased, bonus] = await Promise.all([
      this.prisma.creditLedger.aggregate({
        where: { ...baseWhere, type: CreditType.SUBSCRIPTION },
        _sum: { remaining: true },
      }),
      this.prisma.creditLedger.aggregate({
        where: { ...baseWhere, type: CreditType.PURCHASE },
        _sum: { remaining: true },
      }),
      this.prisma.creditLedger.aggregate({
        where: {
          ...baseWhere,
          type: { in: [CreditType.BONUS, CreditType.REFUND] },
        },
        _sum: { remaining: true },
      }),
    ]);

    return {
      subscription: subscription._sum.remaining ?? 0,
      purchased: purchased._sum.remaining ?? 0,
      bonus: bonus._sum.remaining ?? 0,
    };
  }

  /**
   * Get the next batch of credits to expire.
   */
  async getExpiringCredits(walletId: string): Promise<ExpiringCredits | null> {
    const result = await this.prisma.creditLedger.groupBy({
      by: ['expiresAt'],
      where: {
        walletId,
        remaining: { gt: 0 },
        expiresAt: { gt: new Date() },
      },
      _sum: { remaining: true },
      orderBy: { expiresAt: 'asc' },
      take: 1,
    });

    if (result.length === 0 || !result[0].expiresAt) return null;

    return {
      amount: result[0]._sum.remaining ?? 0,
      expiresAt: result[0].expiresAt.toISOString(),
    };
  }

  /**
   * Expire credits that have passed their expiration date (for cron job).
   */
  async expireCredits(): Promise<{ expired: number; affectedWalletIds: string[] }> {
    const expiredEntries = await this.prisma.creditLedger.findMany({
      where: {
        remaining: { gt: 0 },
        expiresAt: { lte: new Date() },
      },
      select: { id: true, walletId: true, remaining: true },
    });

    if (expiredEntries.length === 0) {
      return { expired: 0, affectedWalletIds: [] };
    }

    const totalExpired = expiredEntries.reduce((sum, e) => sum + e.remaining, 0);
    const affectedWalletIds = [...new Set(expiredEntries.map((e) => e.walletId))];

    // Zero out all expired entries
    await this.prisma.creditLedger.updateMany({
      where: {
        id: { in: expiredEntries.map((e) => e.id) },
      },
      data: { remaining: 0 },
    });

    // Sync balances for all affected wallets
    await Promise.all(
      affectedWalletIds.map((wId) => this.syncWalletBalance(wId)),
    );

    this.logger.log(`Expired ${totalExpired} credits across ${affectedWalletIds.length} wallets`);
    return { expired: totalExpired, affectedWalletIds };
  }

  /**
   * Recalculate and sync the wallet balance from ledger entries.
   * Accepts an optional Prisma transaction client.
   */
  async syncWalletBalance(
    walletId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    const result = await client.creditLedger.aggregate({
      where: {
        walletId,
        remaining: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _sum: { remaining: true },
    });

    const balance = result._sum.remaining ?? 0;

    await client.wallet.update({
      where: { id: walletId },
      data: { balance },
    });
  }
}
