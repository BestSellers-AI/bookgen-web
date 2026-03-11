import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import {
  UserRole,
  Prisma,
  SubscriptionStatus,
  PurchaseStatus,
  CreditType,
  WalletTransactionType,
} from '@prisma/client';
import { paginate, buildPaginatedResponse } from '../common/utils/paginate';
import type {
  PaginatedResponse,
  AdminUserSummary,
  AdminUserDetail,
  AdminBookSummary,
  AdminSubscriptionSummary,
  AdminPurchaseSummary,
  DashboardStats,
} from '@bestsellers/shared';
import {
  AdminPaginationDto,
  AdminAddCreditsDto,
  AdminChangeRoleDto,
  UpdateProductDto,
  CreatePriceDto,
} from './dto';
import { StripeService } from '../stripe/stripe.service';
import { ConfigDataService } from '../config-data/config-data.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService,
    private readonly configDataService: ConfigDataService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Users                                                              */
  /* ------------------------------------------------------------------ */

  async getUsers(
    query: AdminPaginationDto,
  ): Promise<PaginatedResponse<AdminUserSummary>> {
    const { page = 1, perPage = 20, search } = query;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
        include: {
          wallet: { select: { balance: true } },
          subscriptions: {
            where: {
              status: {
                in: [
                  SubscriptionStatus.ACTIVE,
                  SubscriptionStatus.TRIALING,
                  SubscriptionStatus.PAST_DUE,
                ],
              },
            },
            take: 1,
            select: { plan: true },
          },
          _count: { select: { books: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data: AdminUserSummary[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as unknown as AdminUserSummary['role'],
      onboardingCompleted: u.onboardingCompleted,
      balance: u.wallet?.balance ?? 0,
      activePlan: (u.subscriptions[0]?.plan as unknown as AdminUserSummary['activePlan']) ?? null,
      booksCount: u._count.books,
      createdAt: u.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async getUserById(id: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        wallet: { select: { balance: true } },
        subscriptions: {
          where: {
            status: {
              in: [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
                SubscriptionStatus.PAST_DUE,
              ],
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { books: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const sub = user.subscriptions[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role as unknown as AdminUserDetail['role'],
      stripeCustomerId: user.stripeCustomerId,
      onboardingCompleted: user.onboardingCompleted,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      wallet: user.wallet ? { balance: user.wallet.balance } : null,
      subscription: sub
        ? {
            id: sub.id,
            plan: sub.plan as unknown as NonNullable<AdminUserDetail['subscription']>['plan'],
            status: sub.status as unknown as NonNullable<AdminUserDetail['subscription']>['status'],
            billingInterval: sub.billingInterval as unknown as NonNullable<AdminUserDetail['subscription']>['billingInterval'],
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          }
        : null,
      booksCount: user._count.books,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async changeUserRole(
    id: string,
    callerId: string,
    dto: AdminChangeRoleDto,
  ): Promise<{ role: string }> {
    // Prevent admin from changing their own role
    if (id === callerId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    this.logger.log(`User ${id} role changed to ${dto.role} by admin ${callerId}`);
    return { role: dto.role };
  }

  async addCredits(
    id: string,
    dto: AdminAddCreditsDto,
  ): Promise<{ balance: number }> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.walletService.addCredits(id, dto.amount, CreditType.BONUS, {
      description: dto.description ?? 'Admin bonus credits',
      transactionType: WalletTransactionType.BONUS,
    });

    const wallet = await this.walletService.findOrCreateWallet(id);

    this.logger.log(`Added ${dto.amount} bonus credits to user ${id}`);
    return { balance: wallet.balance };
  }

  /* ------------------------------------------------------------------ */
  /*  Books                                                              */
  /* ------------------------------------------------------------------ */

  async getBooks(
    query: AdminPaginationDto,
  ): Promise<PaginatedResponse<AdminBookSummary>> {
    const { page = 1, perPage = 20, search } = query;

    const where: Prisma.BookWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
        include: {
          user: { select: { email: true } },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    const data: AdminBookSummary[] = books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      status: b.status as unknown as AdminBookSummary['status'],
      userId: b.userId,
      userEmail: b.user.email,
      wordCount: b.wordCount,
      pageCount: b.pageCount,
      createdAt: b.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async getBookById(id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: {
        chapters: { orderBy: { sequence: 'asc' } },
        files: true,
        addons: true,
        translations: true,
        audiobooks: true,
        images: { orderBy: { position: 'asc' } },
        sharedBooks: { where: { isActive: true }, take: 1 },
        user: { select: { email: true, name: true } },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  /* ------------------------------------------------------------------ */
  /*  Subscriptions                                                      */
  /* ------------------------------------------------------------------ */

  async getSubscriptions(
    query: AdminPaginationDto,
  ): Promise<PaginatedResponse<AdminSubscriptionSummary>> {
    const { page = 1, perPage = 20 } = query;

    const [subs, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
        include: { user: { select: { email: true } } },
      }),
      this.prisma.subscription.count(),
    ]);

    const data: AdminSubscriptionSummary[] = subs.map((s) => ({
      id: s.id,
      userId: s.userId,
      userEmail: s.user.email,
      plan: s.plan as unknown as AdminSubscriptionSummary['plan'],
      status: s.status as unknown as AdminSubscriptionSummary['status'],
      billingInterval: s.billingInterval as unknown as AdminSubscriptionSummary['billingInterval'],
      currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      createdAt: s.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  /* ------------------------------------------------------------------ */
  /*  Purchases                                                          */
  /* ------------------------------------------------------------------ */

  async getPurchases(
    query: AdminPaginationDto,
  ): Promise<PaginatedResponse<AdminPurchaseSummary>> {
    const { page = 1, perPage = 20 } = query;

    const [purchases, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
        include: { user: { select: { email: true } } },
      }),
      this.prisma.purchase.count(),
    ]);

    const data: AdminPurchaseSummary[] = purchases.map((p) => ({
      id: p.id,
      userId: p.userId,
      userEmail: p.user.email,
      status: p.status as unknown as AdminPurchaseSummary['status'],
      totalAmount: p.totalAmount,
      currency: p.currency,
      gateway: p.gateway,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  /* ------------------------------------------------------------------ */
  /*  Dashboard Stats                                                    */
  /* ------------------------------------------------------------------ */

  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      totalBooks,
      booksThisMonth,
      totalRevenue,
      revenueThisMonth,
      activeSubsByPlan,
      topAddons,
    ] = await Promise.all([
      // Total users
      this.prisma.user.count({ where: { deletedAt: null } }),

      // Active users (logged in within 30 days — users with sessions)
      this.prisma.user.count({
        where: {
          deletedAt: null,
          sessions: { some: { expires: { gt: now } } },
        },
      }),

      // Total books
      this.prisma.book.count({ where: { deletedAt: null } }),

      // Books this month
      this.prisma.book.count({
        where: { deletedAt: null, createdAt: { gte: startOfMonth } },
      }),

      // Total revenue
      this.prisma.purchase.aggregate({
        where: { status: PurchaseStatus.PAID },
        _sum: { totalAmount: true },
      }),

      // Revenue this month
      this.prisma.purchase.aggregate({
        where: {
          status: PurchaseStatus.PAID,
          paidAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),

      // Active subscriptions by plan
      this.prisma.subscription.groupBy({
        by: ['plan'],
        where: {
          status: {
            in: [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.TRIALING,
            ],
          },
        },
        _count: true,
      }),

      // Top addons
      this.prisma.bookAddon.groupBy({
        by: ['kind'],
        _count: true,
        orderBy: { _count: { kind: 'desc' } },
        take: 10,
      }),
    ]);

    const activeSubscriptions: Record<string, number> = {};
    for (const sub of activeSubsByPlan) {
      activeSubscriptions[sub.plan] = sub._count;
    }

    return {
      totalUsers,
      activeUsers,
      totalBooks,
      booksThisMonth,
      totalRevenueCents: totalRevenue._sum.totalAmount ?? 0,
      revenueThisMonthCents: revenueThisMonth._sum.totalAmount ?? 0,
      activeSubscriptions,
      topAddons: topAddons.map((a) => ({
        kind: a.kind,
        count: a._count,
      })),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Products                                                           */
  /* ------------------------------------------------------------------ */

  async listProducts() {
    return this.prisma.product.findMany({
      include: { prices: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { prices: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        metadata: dto.metadata,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
      include: { prices: true },
    });

    // Sync name/description to Stripe if product has a stripeProductId
    if (product.stripeProductId && (dto.name || dto.description)) {
      try {
        await this.stripeService.updateStripeProduct(product.stripeProductId, {
          name: dto.name,
          description: dto.description,
        });
      } catch (error) {
        this.logger.warn(`Failed to sync product ${id} to Stripe: ${error}`);
      }
    }

    await this.configDataService.invalidateCache();
    return updated;
  }

  async addProductPrice(productId: string, dto: CreatePriceDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    let stripePriceId: string | null = null;

    // Create price in Stripe if product has a stripeProductId and amount > 0
    if (product.stripeProductId && dto.amount > 0) {
      const recurring = dto.billingInterval
        ? {
            interval: (dto.billingInterval === 'ANNUAL'
              ? 'year'
              : 'month') as 'month' | 'year',
          }
        : undefined;

      stripePriceId = await this.stripeService.createStripePrice({
        stripeProductId: product.stripeProductId,
        amount: dto.amount,
        currency: dto.currency ?? 'usd',
        recurring,
      });
    }

    const price = await this.prisma.productPrice.create({
      data: {
        productId,
        amount: dto.amount,
        currency: dto.currency ?? 'usd',
        billingInterval: dto.billingInterval as any,
        creditsCost: dto.creditsCost,
        stripePriceId,
      },
    });

    await this.configDataService.invalidateCache();
    return price;
  }

  async deactivatePrice(productId: string, priceId: string) {
    const price = await this.prisma.productPrice.findFirst({
      where: { id: priceId, productId },
    });
    if (!price) throw new NotFoundException('Price not found');

    // Archive in Stripe
    if (price.stripePriceId) {
      try {
        await this.stripeService.archiveStripePrice(price.stripePriceId);
      } catch (error) {
        this.logger.warn(
          `Failed to archive Stripe price ${price.stripePriceId}: ${error}`,
        );
      }
    }

    const updated = await this.prisma.productPrice.update({
      where: { id: priceId },
      data: { isActive: false },
    });

    await this.configDataService.invalidateCache();
    return updated;
  }

  /* ------------------------------------------------------------------ */
  /*  App Config                                                         */
  /* ------------------------------------------------------------------ */

  async getAppConfigs() {
    return this.prisma.appConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateAppConfig(
    key: string,
    value: Record<string, any>,
    updatedBy?: string,
  ) {
    const config = await this.prisma.appConfig.upsert({
      where: { key },
      update: { value, updatedBy },
      create: { key, value, updatedBy },
    });

    await this.configDataService.invalidateCache();
    return config;
  }
}
