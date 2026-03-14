import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppConfigPayload,
  AnnouncementConfigPayload,
  SubscriptionPlanConfig,
  CreditPackConfig,
  FreeTierConfig,
  BundleConfigPayload,
} from '@bestsellers/shared';
import {
  SUBSCRIPTION_PLANS,
  FREE_TIER,
  CREDITS_COST,
  BUNDLES,
} from '@bestsellers/shared';

@Injectable()
export class ConfigDataService implements OnModuleInit {
  private readonly logger = new Logger(ConfigDataService.name);
  private cache: AppConfigPayload | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadConfig();
  }

  /** Get the full app config payload (cached). */
  async getConfig(): Promise<AppConfigPayload> {
    if (this.cache && Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cache;
    }
    return this.loadConfig();
  }

  /** Force reload config from DB and update cache. */
  async invalidateCache(): Promise<AppConfigPayload> {
    this.logger.log('Invalidating config cache');
    return this.loadConfig();
  }

  /** Get credit cost for a specific operation kind. Falls back to shared constants. */
  async getCreditsCost(kind: string): Promise<number> {
    const config = await this.getConfig();
    return config.creditsCost[kind] ?? CREDITS_COST[kind] ?? 0;
  }

  /** Get plan config by plan enum value (e.g., 'ASPIRANTE'). */
  async getPlanConfig(
    plan: string,
  ): Promise<SubscriptionPlanConfig | undefined> {
    const config = await this.getConfig();
    return config.subscriptionPlans.find((p) => p.plan === plan);
  }

  /** Get free tier config. */
  async getFreeTier(): Promise<FreeTierConfig> {
    const config = await this.getConfig();
    return config.freeTier;
  }

  /** Get bundles config. */
  async getBundles(): Promise<Record<string, BundleConfigPayload>> {
    const config = await this.getConfig();
    return config.bundles;
  }

  /** Load all config from DB and build the payload. */
  private async loadConfig(): Promise<AppConfigPayload> {
    this.logger.log('Loading config from database');

    try {
      const [products, appConfigs] = await Promise.all([
        this.prisma.product.findMany({
          where: { isActive: true },
          include: { prices: { where: { isActive: true } } },
          orderBy: { sortOrder: 'asc' },
        }),
        this.prisma.appConfig.findMany(),
      ]);

      // Build AppConfig lookup
      const configMap = new Map<string, any>();
      for (const c of appConfigs) {
        configMap.set(c.key, c.value);
      }

      // Build subscription plans
      const subscriptionPlans: SubscriptionPlanConfig[] = products
        .filter((p) => p.kind === 'SUBSCRIPTION_PLAN')
        .map((p) => {
          const meta = (p.metadata ?? {}) as Record<string, any>;
          const monthlyPrice = p.prices.find(
            (pr) => pr.billingInterval === 'MONTHLY',
          );
          const annualPrice = p.prices.find(
            (pr) => pr.billingInterval === 'ANNUAL',
          );
          const plan = meta.plan ?? 'ASPIRANTE';
          const fallback =
            SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];

          return {
            plan,
            name: p.name,
            slug: p.slug,
            description: p.description,
            monthlyPriceCents:
              monthlyPrice?.amount ?? fallback?.monthlyPriceCents ?? 0,
            annualPriceCents:
              annualPrice?.amount ?? fallback?.annualPriceCents ?? 0,
            annualMonthlyEquivalentCents: annualPrice
              ? Math.round(annualPrice.amount / 12)
              : (fallback?.annualMonthlyEquivalentCents ?? 0),
            monthlyCredits:
              meta.monthlyCredits ?? fallback?.monthlyCredits ?? 0,
            booksPerMonth: meta.booksPerMonth ?? fallback?.booksPerMonth ?? 0,
            freeRegensPerMonth:
              meta.freeRegensPerMonth ?? fallback?.freeRegensPerMonth ?? 0,
            commercialLicense:
              meta.commercialLicense ?? fallback?.commercialLicense ?? false,
            queuePriority:
              meta.queuePriority ?? fallback?.queuePriority ?? 'standard',
            creditAccumulationMonths:
              meta.creditAccumulationMonths ??
              fallback?.creditAccumulationMonths ??
              0,
            amazonDiscount:
              meta.amazonDiscount ?? fallback?.amazonDiscount ?? 0,
            historyRetentionDays:
              meta.historyRetentionDays ??
              fallback?.historyRetentionDays ??
              null,
            fullEditor: meta.fullEditor ?? fallback?.fullEditor ?? false,
            prioritySupport:
              meta.prioritySupport ?? fallback?.prioritySupport ?? false,
          };
        });

      // Build credit packs
      const creditPacks: CreditPackConfig[] = products
        .filter((p) => p.kind === 'CREDIT_PACK')
        .map((p) => ({
          name: p.name,
          slug: p.slug,
          credits: p.creditsAmount ?? 0,
          priceCents: p.prices[0]?.amount ?? 0,
        }));

      // Credits cost from AppConfig, with fallback to shared constants
      const dbCreditsCost = (configMap.get('CREDITS_COST') ?? {}) as Record<
        string,
        number
      >;
      const creditsCost: Record<string, number> = {
        ...CREDITS_COST,
        ...dbCreditsCost,
      };

      // Free tier from AppConfig, with fallback to shared constants
      const dbFreeTier = configMap.get('FREE_TIER') as
        | Record<string, any>
        | undefined;
      const freeTier: FreeTierConfig = {
        previewsPerMonth:
          dbFreeTier?.previewsPerMonth ?? FREE_TIER.previewsPerMonth,
        credits: dbFreeTier?.credits ?? FREE_TIER.credits,
        booksPerMonth: dbFreeTier?.booksPerMonth ?? FREE_TIER.booksPerMonth,
        freeRegensPerMonth:
          dbFreeTier?.freeRegensPerMonth ?? FREE_TIER.freeRegensPerMonth,
        commercialLicense:
          dbFreeTier?.commercialLicense ?? FREE_TIER.commercialLicense,
        queuePriority: dbFreeTier?.queuePriority ?? FREE_TIER.queuePriority,
        fullEditor: dbFreeTier?.fullEditor ?? FREE_TIER.fullEditor,
      };

      // Bundles from AppConfig, with fallback to shared constants
      const dbBundles = (configMap.get('BUNDLES') ?? {}) as Record<
        string,
        any
      >;
      const bundles: Record<string, BundleConfigPayload> = {};
      // Merge: DB values override shared constants
      const allBundleKeys = new Set([
        ...Object.keys(BUNDLES),
        ...Object.keys(dbBundles),
      ]);
      for (const key of allBundleKeys) {
        const db = dbBundles[key];
        const fallbackBundle = BUNDLES[key];
        if (db) {
          bundles[key] = db as BundleConfigPayload;
        } else if (fallbackBundle) {
          bundles[key] = {
            id: fallbackBundle.id,
            kinds: fallbackBundle.kinds as unknown as string[],
            originalCost: fallbackBundle.originalCost,
            cost: fallbackBundle.cost,
            discountPercent: fallbackBundle.discountPercent,
          };
        }
      }

      // Announcement bar from AppConfig (nullable — disabled if not set)
      const announcement =
        (configMap.get('ANNOUNCEMENT') as AnnouncementConfigPayload | undefined) ?? null;

      const payload: AppConfigPayload = {
        subscriptionPlans,
        creditPacks,
        creditsCost,
        freeTier,
        bundles,
        announcement,
      };

      this.cache = payload;
      this.cacheTimestamp = Date.now();
      this.logger.log('Config loaded and cached');

      return payload;
    } catch (error) {
      this.logger.error('Failed to load config from DB, using fallback', error);
      // If DB fails, return a fallback based on shared constants
      if (this.cache) return this.cache;
      throw error;
    }
  }
}
