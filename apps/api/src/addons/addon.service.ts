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
  FileType,
  ProductKind,
  PublishingStatus,
  NotificationType,
} from '@prisma/client';
import { ConfigDataService } from '../config-data/config-data.service';
import { AppConfigService } from '../config/app-config.service';
import { GenerationService } from '../generation/generation.service';
import { EmailService } from '../email/email.service';
import { addonPurchaseEmail } from '../email/email-templates';
import type { BookAddonSummary } from '@bestsellers/shared';
import { RequestAddonDto } from './dto';

@Injectable()
export class AddonService {
  private readonly logger = new Logger(AddonService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly n8nClient: N8nClientService,
    private readonly configDataService: ConfigDataService,
    private readonly appConfig: AppConfigService,
    private readonly generationService: GenerationService,
    private readonly emailService: EmailService,
  ) {}

  async request(
    userId: string,
    bookId: string,
    dto: RequestAddonDto,
  ): Promise<BookAddonSummary> {
    // Verify book ownership + status
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: {
        id: true,
        status: true,
        title: true,
        subtitle: true,
        author: true,
        briefing: true,
        planning: true,
        settings: true,
        introduction: true,
        conclusion: true,
        finalConsiderations: true,
        glossary: true,
        appendix: true,
        closure: true,
        wordCount: true,
        pageCount: true,
        selectedCoverFileId: true,
        chapters: {
          orderBy: { sequence: 'asc' as const },
          select: { id: true, sequence: true, title: true },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.GENERATED) {
      throw new BadRequestException(
        'Add-ons can only be requested for fully generated books',
      );
    }

    // Validate cover translation prerequisites
    if (dto.kind === 'ADDON_COVER_TRANSLATION') {
      if (!book.selectedCoverFileId) {
        throw new BadRequestException(
          'Please select a cover before requesting cover translation.',
        );
      }
      // Block if a translated cover already exists for this language (unless regenerating)
      const targetLang = dto.params?.targetLanguage as string | undefined;
      if (targetLang && dto.params?.regenerate !== true) {
        const existingCover = await this.prisma.bookFile.findFirst({
          where: {
            bookId,
            fileType: FileType.COVER_TRANSLATED,
            fileName: `cover-translated-${targetLang}.png`,
          },
        });
        if (existingCover) {
          throw new BadRequestException(
            'A translated cover already exists for this language. Use regenerate to update it.',
          );
        }
      }
    }

    // Block duplicate book translation for same language
    if (dto.kind === 'ADDON_TRANSLATION') {
      const targetLang = dto.params?.targetLanguage as string | undefined;
      if (targetLang) {
        const existingTranslation = await this.prisma.bookTranslation.findFirst({
          where: {
            bookId,
            targetLanguage: targetLang,
            status: { not: 'ERROR' },
          },
        });
        if (existingTranslation) {
          throw new BadRequestException(
            'A translation already exists for this language.',
          );
        }
      }
    }

    // Determine credit cost
    const creditsCost = await this.configDataService.getCreditsCost(dto.kind);
    if (!creditsCost) {
      throw new BadRequestException(`Unknown addon kind: ${dto.kind}`);
    }

    // Regeneration of existing cover translation is free
    const isRegeneration = dto.params?.regenerate === true;
    const actualCost = isRegeneration ? 0 : creditsCost;

    // Create addon record first (PENDING)
    const translationId = (dto.params?.translationId as string) || null;
    const addon = await this.prisma.bookAddon.create({
      data: {
        bookId,
        kind: dto.kind,
        status: AddonStatus.PENDING,
        creditsCost: actualCost,
        ...(translationId && { translationId }),
      },
    });

    // Debit credits (skip for free regenerations)
    if (actualCost > 0) {
      await this.walletService.debitCredits(
        userId,
        actualCost,
        WalletTransactionType.ADDON_PURCHASE,
        `Add-on: ${dto.kind}`,
        { bookId, addonId: addon.id },
      );
    }

    // Send addon purchase email
    const addonUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, locale: true },
    });
    if (addonUser && actualCost > 0) {
      const email = addonPurchaseEmail({
        userName: addonUser.name ?? 'there',
        addonKind: dto.kind,
        bookTitle: book.title,
        bookUrl: `${this.appConfig.frontendUrl}/dashboard/books/${bookId}`,
        locale: addonUser.locale,
      });
      this.emailService.send({ to: addonUser.email, subject: email.subject, html: email.html });
    }

    // Short-circuit for publishing addons — no generation dispatch needed
    if (
      dto.kind === 'ADDON_AMAZON_STANDARD' ||
      dto.kind === 'ADDON_AMAZON_PREMIUM'
    ) {
      try {
        // Update addon to PROCESSING (manual admin workflow)
        const processingAddon = await this.prisma.bookAddon.update({
          where: { id: addon.id },
          data: { status: AddonStatus.PROCESSING },
        });

        // Create the PublishingRequest
        const pubRequest = await this.prisma.publishingRequest.create({
          data: {
            bookId,
            addonId: addon.id,
            userId,
            translationId: translationId || undefined,
            platform:
              dto.kind === 'ADDON_AMAZON_PREMIUM'
                ? 'amazon_kdp_premium'
                : 'amazon_kdp',
            status: PublishingStatus.PREPARING,
          },
        });

        // Dispatch webhook (fire-and-forget)
        this.dispatchPublishingWebhook(pubRequest.id).catch(() => {});

        // Notify the user
        await this.prisma.notification.create({
          data: {
            userId,
            type: NotificationType.PUBLISHING_UPDATE,
            title: 'Publishing Request Created',
            message: `Your ${dto.kind === 'ADDON_AMAZON_PREMIUM' ? 'Premium' : 'Standard'} Amazon publishing request has been submitted for review.`,
            data: { bookId, addonId: addon.id },
          },
        });

        this.logger.log(
          `Publishing addon ${addon.id} (${dto.kind}) created for book ${bookId}`,
        );

        return {
          id: processingAddon.id,
          kind: processingAddon.kind as unknown as BookAddonSummary['kind'],
          status: processingAddon.status as unknown as BookAddonSummary['status'],
          translationId: processingAddon.translationId,
          resultUrl: processingAddon.resultUrl,
          resultData: processingAddon.resultData as Record<string, unknown> | null,
          creditsCost: processingAddon.creditsCost,
          error: processingAddon.error,
          createdAt: processingAddon.createdAt.toISOString(),
          updatedAt: processingAddon.updatedAt.toISOString(),
        };
      } catch {
        // Refund credits if publishing request creation fails
        if (addon.creditsCost && addon.creditsCost > 0) {
          await this.walletService.addCredits(userId, addon.creditsCost, CreditType.REFUND, {
            description: `Refund: ${dto.kind} publishing request failed`,
            transactionType: WalletTransactionType.REFUND,
          });
        }
        await this.prisma.bookAddon.update({
          where: { id: addon.id },
          data: {
            status: AddonStatus.ERROR,
            error: 'Failed to create publishing request',
          },
        });
        throw new BadRequestException(
          'Failed to create publishing request. Credits have been refunded.',
        );
      }
    }

    // Build addon-specific params
    const dispatchParams: Record<string, unknown> = { ...(dto.params ?? {}) };

    // Enrich addon dispatch with book context
    const CONTEXT_KINDS = new Set([
      'ADDON_COVER', 'ADDON_IMAGES', 'ADDON_TRANSLATION',
      'ADDON_COVER_TRANSLATION', 'ADDON_AUDIOBOOK',
    ]);
    if (CONTEXT_KINDS.has(dto.kind)) {
      let contextTitle = book.title;
      let contextSubtitle = book.subtitle;
      let contextChapters = book.chapters.map((ch) => ({
        id: ch.id,
        sequence: ch.sequence,
        title: ch.title,
      }));

      // If this addon is for a translation, use translated data
      if (translationId) {
        const translation = await this.prisma.bookTranslation.findUnique({
          where: { id: translationId },
          include: {
            chapters: {
              orderBy: { sequence: 'asc' as const },
              select: { chapterId: true, sequence: true, translatedTitle: true },
            },
          },
        });
        if (translation) {
          if (translation.translatedTitle) contextTitle = translation.translatedTitle;
          if (translation.translatedSubtitle) contextSubtitle = translation.translatedSubtitle;
          if (translation.chapters.length > 0) {
            contextChapters = translation.chapters.map((tc) => ({
              id: tc.chapterId,
              sequence: tc.sequence,
              title: tc.translatedTitle || contextChapters.find((c) => c.id === tc.chapterId)?.title || '',
            }));
          }
        }
      }

      dispatchParams.bookContext = {
        title: contextTitle,
        subtitle: contextSubtitle,
        author: book.author,
        briefing: book.briefing,
        planning: book.planning,
        settings: book.settings,
        introduction: book.introduction,
        conclusion: book.conclusion,
        finalConsiderations: book.finalConsiderations,
        glossary: book.glossary,
        appendix: book.appendix,
        closure: book.closure,
        wordCount: book.wordCount,
        pageCount: book.pageCount,
        chapters: contextChapters,
      };
    }

    // Dispatch to processing engine
    try {
      if (this.appConfig.useInternalGeneration) {
        await this.generationService.addAddonJob(bookId, {
          addonId: addon.id,
          addonKind: dto.kind as ProductKind,
          params: dispatchParams,
        });
      } else {
        await this.n8nClient.dispatchAddon(bookId, addon.id, dto.kind, dispatchParams);
      }
    } catch {
      // Refund only what was actually charged (addon.creditsCost, not template creditsCost)
      if (addon.creditsCost && addon.creditsCost > 0) {
        await this.walletService.addCredits(userId, addon.creditsCost, CreditType.REFUND, {
          description: `Refund: ${dto.kind} add-on dispatch failed`,
          transactionType: WalletTransactionType.REFUND,
        });
      }
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
      translationId: updated.translationId,
      resultUrl: updated.resultUrl,
      resultData: updated.resultData as Record<string, unknown> | null,
      creditsCost: updated.creditsCost,
      error: updated.error,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async requestBundle(
    userId: string,
    bookId: string,
    bundleId: string,
    params?: Record<string, unknown>,
  ): Promise<BookAddonSummary[]> {
    const allBundles = await this.configDataService.getBundles();
    const bundle = allBundles[bundleId];
    if (!bundle) {
      throw new BadRequestException(`Unknown bundle: ${bundleId}`);
    }

    const hasTranslation = bundle.kinds.includes(ProductKind.ADDON_TRANSLATION as string);
    const hasCoverTranslation = bundle.kinds.includes(ProductKind.ADDON_COVER_TRANSLATION as string);
    const targetLanguage = params?.targetLanguage as string | undefined;

    // Validate: bundles with translation require a target language
    if (hasTranslation && !targetLanguage) {
      throw new BadRequestException('Target language is required for this bundle.');
    }

    // Verify book ownership + status (include full context for addon dispatch)
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: {
        id: true,
        status: true,
        selectedCoverFileId: true,
        title: true,
        subtitle: true,
        author: true,
        briefing: true,
        planning: true,
        settings: true,
        introduction: true,
        conclusion: true,
        finalConsiderations: true,
        glossary: true,
        appendix: true,
        closure: true,
        wordCount: true,
        pageCount: true,
        chapters: {
          select: { id: true, sequence: true, title: true },
          orderBy: { sequence: 'asc' as const },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.status !== BookStatus.GENERATED) {
      throw new BadRequestException(
        'Add-ons can only be requested for fully generated books',
      );
    }

    // Validate: bundles with cover translation require a selected cover
    if (hasCoverTranslation && !book.selectedCoverFileId) {
      throw new BadRequestException('Please select a cover before requesting this bundle.');
    }

    // Check that none of the bundle addons already exist (not cancelled/error)
    const existingAddons = await this.prisma.bookAddon.findMany({
      where: {
        bookId,
        kind: { in: bundle.kinds as ProductKind[] },
        status: { notIn: [AddonStatus.CANCELLED, AddonStatus.ERROR] },
      },
    });

    if (existingAddons.length > 0) {
      const existingKinds = existingAddons.map((a) => a.kind).join(', ');
      throw new BadRequestException(
        `Bundle cannot be purchased: existing addons found (${existingKinds})`,
      );
    }

    const bundleCost = bundle.cost;

    const PUBLISHING_KINDS = new Set<string>([
      ProductKind.ADDON_AMAZON_STANDARD,
      ProductKind.ADDON_AMAZON_PREMIUM,
    ]);

    // Calculate proportional costs so refunds match the discounted bundle price
    const individualCosts = await Promise.all(
      bundle.kinds.map((kind) => this.configDataService.getCreditsCost(kind)),
    );
    const individualTotal = individualCosts.reduce((sum, c) => sum + (c ?? 0), 0);
    const discountRatio = individualTotal > 0 ? bundleCost / individualTotal : 1;
    const proportionalCosts = individualCosts.map((c) => Math.round((c ?? 0) * discountRatio));
    // Fix rounding drift: adjust the largest item so the sum equals bundleCost exactly
    const roundedSum = proportionalCosts.reduce((s, c) => s + c, 0);
    if (roundedSum !== bundleCost && proportionalCosts.length > 0) {
      const maxIdx = proportionalCosts.indexOf(Math.max(...proportionalCosts));
      proportionalCosts[maxIdx] += bundleCost - roundedSum;
    }

    // Create all addon records with proportional costs
    const addonRecords = await Promise.all(
      bundle.kinds.map(async (kind, i) => {
        return this.prisma.bookAddon.create({
          data: {
            bookId,
            kind: kind as ProductKind,
            // Publishing addons go straight to PROCESSING (manual workflow)
            status: PUBLISHING_KINDS.has(kind as ProductKind)
              ? AddonStatus.PROCESSING
              : AddonStatus.PENDING,
            creditsCost: proportionalCosts[i],
          },
        });
      }),
    );

    // Debit bundle cost (throws 402 if insufficient)
    await this.walletService.debitCredits(
      userId,
      bundleCost,
      WalletTransactionType.ADDON_PURCHASE,
      `Bundle: ${bundle.id} (${bundle.kinds.join(' + ')})`,
      { bookId },
    );

    // Dispatch each addon — publishing addons are handled inline, others go to BullMQ
    const dispatched: typeof addonRecords = [];
    try {
      for (const addon of addonRecords) {
        if (PUBLISHING_KINDS.has(addon.kind)) {
          // Create PublishingRequest inline (no queue dispatch)
          const bundlePubRequest = await this.prisma.publishingRequest.create({
            data: {
              bookId,
              addonId: addon.id,
              userId,
              platform:
                addon.kind === ProductKind.ADDON_AMAZON_PREMIUM
                  ? 'amazon_kdp_premium'
                  : 'amazon_kdp',
              status: PublishingStatus.PREPARING,
            },
          });
          // Dispatch webhook (fire-and-forget)
          this.dispatchPublishingWebhook(bundlePubRequest.id).catch(() => {});
          await this.prisma.notification.create({
            data: {
              userId,
              type: NotificationType.PUBLISHING_UPDATE,
              title: 'Publishing Request Created',
              message: `Your ${addon.kind === ProductKind.ADDON_AMAZON_PREMIUM ? 'Premium' : 'Standard'} Amazon publishing request has been submitted for review.`,
              data: { bookId, addonId: addon.id },
            },
          });
        } else {
          // Build dispatch params with book context
          const dispatchParams: Record<string, unknown> = {};
          if (
            (addon.kind === ProductKind.ADDON_TRANSLATION ||
              addon.kind === ProductKind.ADDON_COVER_TRANSLATION) &&
            targetLanguage
          ) {
            dispatchParams.targetLanguage = targetLanguage;
          }

          // Pass sibling addon IDs so post-translation linking only affects bundle addons
          if (addon.kind === ProductKind.ADDON_TRANSLATION) {
            dispatchParams.siblingAddonIds = addonRecords
              .filter((a) => a.id !== addon.id)
              .map((a) => a.id);
          }

          // Enrich with book context for addons that need it
          const CONTEXT_KINDS = new Set<string>([
            ProductKind.ADDON_COVER,
            ProductKind.ADDON_IMAGES,
            ProductKind.ADDON_TRANSLATION,
            ProductKind.ADDON_COVER_TRANSLATION,
          ]);
          if (CONTEXT_KINDS.has(addon.kind)) {
            dispatchParams.bookContext = {
              title: book.title,
              subtitle: book.subtitle,
              author: book.author,
              briefing: book.briefing,
              planning: book.planning,
              settings: book.settings,
              introduction: book.introduction,
              conclusion: book.conclusion,
              finalConsiderations: book.finalConsiderations,
              glossary: book.glossary,
              appendix: book.appendix,
              closure: book.closure,
              wordCount: book.wordCount,
              pageCount: book.pageCount,
              chapters: book.chapters.map((ch) => ({
                id: ch.id,
                sequence: ch.sequence,
                title: ch.title,
              })),
            };
          }

          if (this.appConfig.useInternalGeneration) {
            await this.generationService.addAddonJob(bookId, {
              addonId: addon.id,
              addonKind: addon.kind,
              params: Object.keys(dispatchParams).length > 0 ? dispatchParams : undefined,
            });
          } else {
            await this.n8nClient.dispatchAddon(bookId, addon.id, addon.kind as string, dispatchParams);
          }
        }
        dispatched.push(addon);
      }
    } catch {
      // Refund full bundle cost and mark all addons as ERROR
      await this.walletService.addCredits(userId, bundleCost, CreditType.REFUND, {
        description: `Refund: ${bundle.id} bundle dispatch failed`,
        transactionType: WalletTransactionType.REFUND,
      });
      await Promise.all(
        addonRecords.map((a) =>
          this.prisma.bookAddon.update({
            where: { id: a.id },
            data: {
              status: AddonStatus.ERROR,
              error: 'Failed to dispatch to processing engine',
            },
          }),
        ),
      );
      // Clean up inline-created PublishingRequests for this bundle
      await this.prisma.publishingRequest.deleteMany({
        where: {
          addonId: { in: addonRecords.map((a) => a.id) },
        },
      });
      throw new BadRequestException(
        'Failed to start bundle processing. Credits have been refunded.',
      );
    }

    // Update non-publishing addons to QUEUED
    const updated = await Promise.all(
      addonRecords.map((a) => {
        if (PUBLISHING_KINDS.has(a.kind)) {
          // Publishing addons already in PROCESSING, just return them
          return Promise.resolve(a);
        }
        return this.prisma.bookAddon.update({
          where: { id: a.id },
          data: { status: AddonStatus.QUEUED },
        });
      }),
    );

    this.logger.log(
      `Bundle ${bundle.id} requested for book ${bookId} (${addonRecords.length} addons)`,
    );

    return updated.map((a) => ({
      id: a.id,
      kind: a.kind as unknown as BookAddonSummary['kind'],
      status: a.status as unknown as BookAddonSummary['status'],
      translationId: a.translationId,
      resultUrl: a.resultUrl,
      resultData: a.resultData as Record<string, unknown> | null,
      creditsCost: a.creditsCost,
      error: a.error,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
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
      translationId: a.translationId,
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
      translationId: addon.translationId,
      resultUrl: addon.resultUrl,
      resultData: addon.resultData as Record<string, unknown> | null,
      creditsCost: addon.creditsCost,
      error: addon.error,
      createdAt: addon.createdAt.toISOString(),
      updatedAt: addon.updatedAt.toISOString(),
    };
  }

  async upgradePublishing(
    userId: string,
    bookId: string,
    addonId: string,
  ): Promise<BookAddonSummary> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!book) throw new NotFoundException('Book not found');

    const addon = await this.prisma.bookAddon.findFirst({
      where: { id: addonId, bookId },
    });
    if (!addon) throw new NotFoundException('Add-on not found');

    if (addon.kind !== ProductKind.ADDON_AMAZON_STANDARD) {
      throw new BadRequestException('Only Standard publishing can be upgraded to Premium');
    }

    const upgradeableStatuses: AddonStatus[] = [AddonStatus.PENDING, AddonStatus.QUEUED, AddonStatus.PROCESSING];
    if (!upgradeableStatuses.includes(addon.status as AddonStatus)) {
      throw new BadRequestException(`Cannot upgrade addon with status: ${addon.status}`);
    }

    // Calculate upgrade cost: configurable, fallback to Premium - Standard difference
    const config = await this.configDataService.getConfig();
    const upgradeCost = config.creditsCost['PUBLISHING_UPGRADE_PRICE']
      ?? ((config.creditsCost[ProductKind.ADDON_AMAZON_PREMIUM] ?? 80) - (config.creditsCost[ProductKind.ADDON_AMAZON_STANDARD] ?? 40));

    // Debit upgrade cost (throws 402 if insufficient)
    await this.walletService.debitCredits(
      userId,
      upgradeCost,
      WalletTransactionType.ADDON_PURCHASE,
      'Publishing upgrade: Standard → Premium',
      { bookId, addonId },
    );

    // Update addon kind
    const updated = await this.prisma.bookAddon.update({
      where: { id: addonId },
      data: {
        kind: ProductKind.ADDON_AMAZON_PREMIUM,
        creditsCost: (addon.creditsCost ?? 0) + upgradeCost,
      },
    });

    // Update PublishingRequest platform
    await this.prisma.publishingRequest.updateMany({
      where: { addonId },
      data: { platform: 'amazon_kdp_premium' },
    });

    this.logger.log(`Publishing addon ${addonId} upgraded Standard → Premium for book ${bookId}`);

    return {
      id: updated.id,
      kind: updated.kind as unknown as BookAddonSummary['kind'],
      status: updated.status as unknown as BookAddonSummary['status'],
      translationId: updated.translationId,
      resultUrl: updated.resultUrl,
      resultData: updated.resultData as Record<string, unknown> | null,
      creditsCost: updated.creditsCost,
      error: updated.error,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
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

  async selectCover(
    bookId: string,
    fileId: string,
    userId: string,
  ): Promise<{ coverUrl: string }> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Verify the file belongs to this book and is a cover image
    const file = await this.prisma.bookFile.findFirst({
      where: { id: fileId, bookId, fileType: FileType.COVER_IMAGE },
    });

    if (!file) {
      throw new NotFoundException('Cover image not found');
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: { selectedCoverFileId: fileId },
    });

    this.logger.log(`Cover selected: file ${fileId} for book ${bookId}`);

    return { coverUrl: file.fileUrl };
  }

  async selectChapterImage(
    bookId: string,
    chapterId: string,
    imageId: string,
    userId: string,
  ): Promise<{ imageUrl: string }> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, bookId },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const image = await this.prisma.bookImage.findFirst({
      where: { id: imageId, bookId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Associate image with chapter and set as selected
    await this.prisma.$transaction([
      this.prisma.bookImage.update({
        where: { id: imageId },
        data: { chapterId },
      }),
      this.prisma.chapter.update({
        where: { id: chapterId },
        data: { selectedImageId: imageId },
      }),
    ]);

    this.logger.log(
      `Chapter image selected: image ${imageId} for chapter ${chapterId} (book ${bookId})`,
    );

    return { imageUrl: image.imageUrl };
  }

  /**
   * Fire-and-forget webhook dispatch for new publishing requests.
   * Reads PUBLISHING_WEBHOOK_URL from AppConfig table. Silently logs on failure.
   */
  private async dispatchPublishingWebhook(publishingRequestId: string): Promise<void> {
    try {
      const config = await this.prisma.appConfig.findUnique({
        where: { key: 'PUBLISHING_WEBHOOK_URL' },
      });
      const raw = config?.value as Record<string, unknown> | null;
      const webhookUrl = typeof raw?.url === 'string' ? raw.url : null;
      if (!webhookUrl) return;

      const request = await this.prisma.publishingRequest.findUnique({
        where: { id: publishingRequestId },
        include: {
          book: { select: { id: true, title: true, subtitle: true, author: true, status: true } },
          user: { select: { id: true, email: true, name: true, phoneNumber: true } },
          addon: { select: { id: true, kind: true, status: true, creditsCost: true } },
          translation: { select: { id: true, targetLanguage: true, translatedTitle: true } },
        },
      });
      if (!request) return;

      const payload = {
        publishingRequest: {
          id: request.id,
          status: request.status,
          platform: request.platform,
          createdAt: request.createdAt,
        },
        user: request.user,
        book: request.book,
        addon: request.addon,
        translation: request.translation,
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`Publishing webhook returned ${res.status} for ${publishingRequestId}: ${body}`);
      } else {
        this.logger.log(`Publishing webhook dispatched for ${publishingRequestId}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Publishing webhook failed for ${publishingRequestId}: ${message}`);
    }
  }
}
