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
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  PurchaseStatus,
  CreditType,
  WalletTransactionType,
  ChapterStatus,
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
  AdminAssignPlanDto,
  UpdateProductDto,
  CreatePriceDto,
  CreditUsageQueryDto,
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
      phoneNumber: user.phoneNumber,
      locale: user.locale,
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
      source: user.source,
      visitorId: user.visitorId,
      referrer: user.referrer,
      utmSource: user.utmSource,
      utmMedium: user.utmMedium,
      utmCampaign: user.utmCampaign,
      utmContent: user.utmContent,
      utmTerm: user.utmTerm,
      timezone: user.timezone,
      deviceType: user.deviceType,
      browserLanguage: user.browserLanguage,
      geoCountry: user.geoCountry,
      geoCity: user.geoCity,
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

  async assignPlan(
    userId: string,
    dto: AdminAssignPlanDto,
    callerId: string,
  ): Promise<{ plan: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Block if user has an active Stripe subscription
    const activeStripeSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        source: 'STRIPE',
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });

    if (activeStripeSub) {
      throw new BadRequestException(
        'This user has an active Stripe subscription. Cancel it in Stripe before assigning a plan manually.',
      );
    }

    // Cancel any existing admin-assigned subscription
    await this.prisma.subscription.updateMany({
      where: {
        userId,
        source: 'ADMIN',
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Create a new admin-assigned subscription (no Stripe)
    await this.prisma.subscription.create({
      data: {
        userId,
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        source: 'ADMIN',
      },
    });

    this.logger.log(
      `Admin ${callerId} assigned plan ${dto.plan} to user ${userId}`,
    );
    return { plan: dto.plan };
  }

  async removePlan(
    userId: string,
    callerId: string,
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only cancel admin-assigned subscriptions
    const result = await this.prisma.subscription.updateMany({
      where: {
        userId,
        source: 'ADMIN',
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        'No admin-assigned subscription found to remove. Stripe subscriptions must be cancelled via Stripe.',
      );
    }

    this.logger.log(
      `Admin ${callerId} removed plan from user ${userId}`,
    );
    return { success: true };
  }

  async syncPlanNamesToStripe(): Promise<{ synced: string[] }> {
    const plans = await this.prisma.product.findMany({
      where: { kind: 'SUBSCRIPTION_PLAN', stripeProductId: { not: null } },
      select: { id: true, name: true, slug: true, stripeProductId: true },
    });

    const synced: string[] = [];
    for (const plan of plans) {
      try {
        await this.stripeService.updateStripeProduct(plan.stripeProductId!, {
          name: plan.name,
        });
        synced.push(plan.slug);
        this.logger.log(`Synced plan "${plan.slug}" → "${plan.name}" to Stripe`);
      } catch (error) {
        this.logger.error(
          `Failed to sync plan ${plan.slug} to Stripe: ${error}`,
        );
      }
    }

    return { synced };
  }

  async syncCreditPacksToStripe(): Promise<{ synced: string[] }> {
    const packs = await this.prisma.product.findMany({
      where: { kind: 'CREDIT_PACK', stripeProductId: { not: null } },
      select: { id: true, name: true, slug: true, description: true, stripeProductId: true },
    });

    const synced: string[] = [];
    for (const pack of packs) {
      try {
        await this.stripeService.updateStripeProduct(pack.stripeProductId!, {
          name: pack.name,
          description: pack.description ?? undefined,
        });
        synced.push(pack.slug);
        this.logger.log(`Synced credit pack "${pack.slug}" → "${pack.name}" to Stripe`);
      } catch (error) {
        this.logger.error(
          `Failed to sync credit pack ${pack.slug} to Stripe: ${error}`,
        );
      }
    }

    return { synced };
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
          _count: { select: { translations: true } },
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
      translationsCount: b._count.translations,
      createdAt: b.createdAt.toISOString(),
    }));

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async getBookById(id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: {
        chapters: { orderBy: { sequence: 'asc' } },
        files: { orderBy: { createdAt: 'asc' } },
        addons: true,
        selectedCoverFile: { select: { fileUrl: true } },
        translations: {
          include: { _count: { select: { chapters: true } } },
        },
        audiobooks: true,
        images: { orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] },
        sharedBooks: { where: { isActive: true }, take: 1 },
        user: { select: { email: true, name: true } },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const share = book.sharedBooks[0] ?? null;

    return {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      briefing: book.briefing,
      status: book.status,
      creationMode: book.creationMode,
      planning: book.planning,
      settings: book.settings,
      introduction: book.introduction,
      conclusion: book.conclusion,
      finalConsiderations: book.finalConsiderations,
      glossary: book.glossary,
      resourcesReferences: book.resourcesReferences,
      appendix: book.appendix,
      closure: book.closure,
      coverUrl: book.selectedCoverFile?.fileUrl ?? null,
      selectedCoverFileId: book.selectedCoverFileId,
      wordCount: book.wordCount,
      pageCount: book.pageCount,
      chaptersCount: book.chapters.length,
      completedChaptersCount: book.chapters.filter(
        (ch) => ch.status === ChapterStatus.GENERATED,
      ).length,
      generationStartedAt: book.generationStartedAt?.toISOString() ?? null,
      generationCompletedAt:
        book.generationCompletedAt?.toISOString() ?? null,
      generationError: book.generationError,
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
        status: ch.status,
        wordCount: ch.wordCount,
        isEdited: ch.isEdited,
        content: ch.content,
        editedContent: ch.editedContent,
        topics: ch.topics,
        contextSummary: ch.contextSummary,
        selectedImageId: ch.selectedImageId,
      })),
      files: book.files.map((f) => ({
        id: f.id,
        fileType: f.fileType,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSizeBytes: f.fileSizeBytes,
        createdAt: f.createdAt.toISOString(),
      })),
      addons: book.addons.map((a) => ({
        id: a.id,
        kind: a.kind,
        status: a.status,
        translationId: a.translationId,
        resultUrl: a.resultUrl,
        resultData: a.resultData as Record<string, unknown> | null,
        creditsCost: a.creditsCost,
        error: a.error,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      translations: book.translations.map((t) => ({
        id: t.id,
        targetLanguage: t.targetLanguage,
        status: t.status,
        translatedTitle: t.translatedTitle,
        translatedSubtitle: t.translatedSubtitle,
        totalChapters: t.totalChapters,
        completedChapters: t.completedChapters,
        createdAt: t.createdAt.toISOString(),
      })),
      audiobooks: book.audiobooks.map((ab) => ({
        id: ab.id,
        voiceName: ab.voiceName,
        status: ab.status,
        totalDuration: ab.totalDuration,
        fullAudioUrl: ab.fullAudioUrl,
        createdAt: ab.createdAt.toISOString(),
      })),
      images: book.images.map((img) => ({
        id: img.id,
        chapterId: img.chapterId,
        prompt: img.prompt,
        imageUrl: img.imageUrl,
        caption: img.caption,
        position: img.position,
        createdAt: img.createdAt.toISOString(),
      })),
      share: share
        ? {
            id: share.id,
            shareToken: share.shareToken,
            isActive: share.isActive,
            viewCount: share.viewCount,
            expiresAt: share.expiresAt?.toISOString() ?? null,
            shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`,
            createdAt: share.createdAt.toISOString(),
          }
        : null,
      user: book.user,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    };
  }

  async getBookTranslation(bookId: string, translationId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const translation = await this.prisma.bookTranslation.findFirst({
      where: { id: translationId, bookId },
      include: {
        chapters: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    return {
      id: translation.id,
      targetLanguage: translation.targetLanguage,
      status: translation.status,
      translatedTitle: translation.translatedTitle,
      translatedSubtitle: translation.translatedSubtitle,
      translatedIntroduction: translation.translatedIntroduction,
      translatedConclusion: translation.translatedConclusion,
      translatedFinalConsiderations: translation.translatedFinalConsiderations,
      translatedGlossary: translation.translatedGlossary,
      translatedAppendix: translation.translatedAppendix,
      translatedClosure: translation.translatedClosure,
      totalChapters: translation.totalChapters,
      completedChapters: translation.completedChapters,
      createdAt: translation.createdAt.toISOString(),
      chapters: translation.chapters.map((ch) => ({
        id: ch.id,
        chapterId: ch.chapterId,
        sequence: ch.sequence,
        translatedTitle: ch.translatedTitle,
        translatedContent: ch.translatedContent,
        status: ch.status,
        createdAt: ch.createdAt.toISOString(),
      })),
    };
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

    // Subscription plan names are defined in constants.ts, not editable
    const nameUpdate = product.kind === 'SUBSCRIPTION_PLAN' ? undefined : dto.name;

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: nameUpdate,
        description: dto.description,
        metadata: dto.metadata,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
        creditsAmount: dto.creditsAmount,
      },
      include: { prices: true },
    });

    // Sync name/description to Stripe if product has a stripeProductId
    if (product.stripeProductId && (nameUpdate || dto.description)) {
      try {
        await this.stripeService.updateStripeProduct(product.stripeProductId, {
          name: nameUpdate,
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

  /* ------------------------------------------------------------------ */
  /*  Credit Usage                                                       */
  /* ------------------------------------------------------------------ */

  async getCreditUsage(query: CreditUsageQueryDto) {
    const { page = 1, perPage = 50, search, type, dateFrom, dateTo } = query;

    const where: Prisma.WalletTransactionWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          wallet: {
            user: { email: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [transactions, total, aggregation] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, perPage),
        include: {
          wallet: {
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          },
        },
      }),
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Fetch book titles for transactions that reference a bookId
    const bookIds = transactions
      .map((tx) => tx.bookId)
      .filter((id): id is string => id !== null);

    const books =
      bookIds.length > 0
        ? await this.prisma.book.findMany({
            where: { id: { in: bookIds } },
            select: { id: true, title: true },
          })
        : [];

    const bookTitleMap = new Map(books.map((b) => [b.id, b.title]));

    // Calculate credits spent (negative amounts) and added (positive amounts) separately
    const allMatchingAmounts = await this.prisma.walletTransaction.findMany({
      where,
      select: { amount: true },
    });

    let totalCreditsSpent = 0;
    let totalCreditsAdded = 0;
    for (const tx of allMatchingAmounts) {
      if (tx.amount < 0) {
        totalCreditsSpent += Math.abs(tx.amount);
      } else {
        totalCreditsAdded += tx.amount;
      }
    }

    const data = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      balance: tx.balance,
      description: tx.description,
      bookId: tx.bookId,
      bookTitle: tx.bookId ? (bookTitleMap.get(tx.bookId) ?? null) : null,
      addonId: tx.addonId,
      userId: tx.wallet.user.id,
      userEmail: tx.wallet.user.email,
      userName: tx.wallet.user.name,
      createdAt: tx.createdAt.toISOString(),
    }));

    return {
      ...buildPaginatedResponse(data, total, page, perPage),
      summary: {
        totalCreditsSpent,
        totalCreditsAdded,
        transactionCount: aggregation._count,
      },
    };
  }
}
