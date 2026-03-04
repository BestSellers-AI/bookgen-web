import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditType, WalletTransactionType } from '@prisma/client';
import {
  WalletInfo,
  WalletTransactionItem,
  PaginatedResponse,
  SubscriptionStatus,
} from '@bestsellers/shared';
import { CreditLedgerService } from './credit-ledger.service';
import { MonthlyUsageService } from './monthly-usage.service';
import { paginate, buildPaginatedResponse } from '../common/utils/paginate';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly monthlyUsageService: MonthlyUsageService,
  ) {}

  /**
   * Find or create a wallet for a user.
   */
  async findOrCreateWallet(userId: string) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });
    return wallet;
  }

  /**
   * Get full wallet info for a user: balance, breakdown, expiring credits, free regens.
   */
  async getWalletInfo(userId: string): Promise<WalletInfo> {
    const wallet = await this.findOrCreateWallet(userId);

    // Look up active subscription to determine plan
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const plan = activeSubscription?.plan ?? null;

    const [balance, breakdown, expiringCredits, freeRegens] = await Promise.all([
      this.creditLedgerService.getBalance(wallet.id),
      this.creditLedgerService.getBreakdown(wallet.id),
      this.creditLedgerService.getExpiringCredits(wallet.id),
      this.monthlyUsageService.getFreeRegens(userId, plan),
    ]);

    return {
      balance,
      breakdown,
      expiringCredits,
      freeRegens,
    };
  }

  /**
   * Get paginated wallet transactions for a user.
   */
  async getTransactions(
    userId: string,
    query: { page?: number; perPage?: number; type?: WalletTransactionType },
  ): Promise<PaginatedResponse<WalletTransactionItem>> {
    const wallet = await this.findOrCreateWallet(userId);
    const { page = 1, perPage = 20 } = query;

    const where: Record<string, unknown> = { walletId: wallet.id };
    if (query.type) {
      where.type = query.type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    const data: WalletTransactionItem[] = transactions.map((t) => ({
      id: t.id,
      type: t.type as unknown as WalletTransactionItem['type'],
      amount: t.amount,
      balance: t.balance,
      description: t.description,
      bookId: t.bookId,
      addonId: t.addonId,
      createdAt: t.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  /**
   * Add credits to a user's wallet and record a transaction.
   */
  async addCredits(
    userId: string,
    amount: number,
    creditType: CreditType,
    params: {
      expiresAt?: Date;
      source?: string;
      sourceId?: string;
      description?: string;
      transactionType: WalletTransactionType;
    },
  ): Promise<void> {
    const wallet = await this.findOrCreateWallet(userId);

    await this.creditLedgerService.addCredits(wallet.id, {
      amount,
      type: creditType,
      expiresAt: params.expiresAt,
      source: params.source,
      sourceId: params.sourceId,
    });

    // Re-fetch balance after adding credits
    const currentBalance = await this.creditLedgerService.getBalance(wallet.id);

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: params.transactionType,
        amount,
        balance: currentBalance,
        description: params.description ?? null,
      },
    });

    this.logger.log(
      `Added ${amount} credits to user ${userId} (type: ${params.transactionType})`,
    );
  }

  /**
   * Debit credits from a user's wallet and record a transaction.
   */
  async debitCredits(
    userId: string,
    amount: number,
    transactionType: WalletTransactionType,
    description: string,
    refs?: { bookId?: string; addonId?: string },
  ): Promise<void> {
    const wallet = await this.findOrCreateWallet(userId);

    await this.creditLedgerService.debitCredits(wallet.id, amount);

    // Re-fetch balance after debiting
    const currentBalance = await this.creditLedgerService.getBalance(wallet.id);

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: transactionType,
        amount: -amount,
        balance: currentBalance,
        description,
        bookId: refs?.bookId ?? null,
        addonId: refs?.addonId ?? null,
      },
    });

    this.logger.log(
      `Debited ${amount} credits from user ${userId} (type: ${transactionType})`,
    );
  }

  /**
   * Check if a user has enough credits for an operation.
   */
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.findOrCreateWallet(userId);
    const balance = await this.creditLedgerService.getBalance(wallet.id);
    return balance >= amount;
  }
}
