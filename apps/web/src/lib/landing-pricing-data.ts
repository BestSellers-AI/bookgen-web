import type { SubscriptionPlanConfig, CreditPackConfig } from '@bestsellers/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  textKey: string
  included: boolean
  soon?: boolean
}

export interface Plan {
  id: string
  planEnum: string // maps to SubscriptionPlanConfig.plan (ASPIRANTE, PROFISSIONAL, BESTSELLER)
  nameKey: string
  credits: number
  booksPerMonth: number
  monthlyPrice: number
  annualMonthlyPrice: number
  annualTotal: number
  popular: boolean
  badgeKey?: string
  features: PlanFeature[]
  ctaKey: string
  highlightKey?: string
}

export interface CreditPack {
  id: string
  slug: string // maps to CreditPackConfig.slug
  nameKey: string
  credits: number
  price: number
  fullPrice?: number // anchor price for strikethrough display
  popular: boolean
  labelKey: string
  useCases: { emoji: string; textKey: string }[]
  features: PlanFeature[]
  ctaKey: string
}

export interface Service {
  nameKey: string
  costKey: string // maps to creditsCost key
  credits: number // fallback
}

export interface CalculatorOption {
  labelKey: string
  value: number
  recommendation: string
  recommendationLabelKey: string
}

// ─── Plan UI data (features, badges, CTAs) ───────────────────────────────────
// Prices and credits are overridden from config store at runtime

interface PlanUiData {
  id: string
  planEnum: string
  nameKey: string
  popular: boolean
  badgeKey?: string
  ctaKey: string
  highlightKey?: string
  features: PlanFeature[]
}

const PLAN_UI: PlanUiData[] = [
  {
    id: 'autor',
    planEnum: 'ASPIRANTE',
    nameKey: 'planAutorName',
    popular: false,
    ctaKey: 'planAutorCta',
    highlightKey: 'planAutorHighlight',
    features: [
      { textKey: 'planFeature300Credits', included: true },
      { textKey: 'planFeaturePersonalLicense', included: true },
      { textKey: 'planFeature30Languages', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureEditor', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureAudiobook', included: true },
      { textKey: 'planFeatureShare', included: true },
      { textKey: 'planFeatureSupport247', included: true },
      { textKey: 'planFeature1Regen', included: true },
      { textKey: 'planFeatureHistory30', included: true },
      { textKey: 'planFeatureStandardQueue', included: true },
      { textKey: 'planFeatureCreditsExpire', included: false },
    ],
  },
  {
    id: 'profissional',
    planEnum: 'PROFISSIONAL',
    nameKey: 'planProfissionalName',
    popular: true,
    badgeKey: 'planBadgeMostPopular',
    ctaKey: 'planProfissionalCta',
    highlightKey: 'planProfissionalHighlight',
    features: [
      { textKey: 'planFeature750Credits', included: true },
      { textKey: 'planFeatureCommercialLicense', included: true },
      { textKey: 'planFeature30Languages', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureFullEditor', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureAudiobook', included: true },
      { textKey: 'planFeatureShare', included: true },
      { textKey: 'planFeatureSupport247', included: true },
      { textKey: 'planFeature2Regens', included: true },
      { textKey: 'planFeatureHistory6m', included: true },
      { textKey: 'planFeaturePriorityQueue', included: true },
      { textKey: 'planFeature10Discount', included: true },
      { textKey: 'planFeatureCreditsAccum1m', included: true },
    ],
  },
  {
    id: 'bestseller',
    planEnum: 'BESTSELLER',
    nameKey: 'planBestsellerName',
    popular: false,
    ctaKey: 'planBestsellerCta',
    highlightKey: 'planBestsellerHighlight',
    features: [
      { textKey: 'planFeature2000Credits', included: true },
      { textKey: 'planFeatureCommercialLicense', included: true },
      { textKey: 'planFeature30Languages', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureFullEditor', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureAudiobook', included: true },
      { textKey: 'planFeatureShare', included: true },
      { textKey: 'planFeaturePriorityHuman', included: true },
      { textKey: 'planFeature5Regens', included: true },
      { textKey: 'planFeatureHistoryUnlimited', included: true },
      { textKey: 'planFeatureExpressQueue', included: true },
      { textKey: 'planFeature15Discount', included: true },
      { textKey: 'planFeatureCreditsAccum3m', included: true },
    ],
  },
]

// Fallback prices (used when config store hasn't loaded yet)
const PLAN_PRICE_FALLBACKS: Record<string, { monthlyPrice: number; annualMonthlyPrice: number; annualTotal: number; credits: number; booksPerMonth: number }> = {
  ASPIRANTE: { monthlyPrice: 29, annualMonthlyPrice: 19, annualTotal: 228, credits: 300, booksPerMonth: 3 },
  PROFISSIONAL: { monthlyPrice: 59, annualMonthlyPrice: 39, annualTotal: 468, credits: 750, booksPerMonth: 7 },
  BESTSELLER: { monthlyPrice: 139, annualMonthlyPrice: 89, annualTotal: 1068, credits: 2000, booksPerMonth: 20 },
}

/**
 * Build Plan[] by merging static UI data with config store plan data.
 * If configPlans is empty/null, uses hardcoded fallbacks.
 */
export function buildPlans(configPlans?: SubscriptionPlanConfig[]): Plan[] {
  return PLAN_UI.map((ui) => {
    const config = configPlans?.find((p) => p.plan === ui.planEnum)
    const fallback = PLAN_PRICE_FALLBACKS[ui.planEnum]

    return {
      ...ui,
      credits: config?.monthlyCredits ?? fallback.credits,
      booksPerMonth: config?.booksPerMonth ?? fallback.booksPerMonth,
      monthlyPrice: config ? config.monthlyPriceCents / 100 : fallback.monthlyPrice,
      annualMonthlyPrice: config ? config.annualMonthlyEquivalentCents / 100 : fallback.annualMonthlyPrice,
      annualTotal: config ? config.annualPriceCents / 100 : fallback.annualTotal,
    }
  })
}

// ─── Credit Pack UI data ─────────────────────────────────────────────────────

interface CreditPackUiData {
  slug: string
  nameKey: string
  popular: boolean
  labelKey: string
  ctaKey: string
  useCases: { emoji: string; textKey: string }[]
  features: PlanFeature[]
}

const CREDIT_PACK_UI: CreditPackUiData[] = [
  {
    slug: 'aspiring-work',
    nameKey: 'creditSoloName',
    popular: false,
    labelKey: 'creditSoloLabel',
    ctaKey: 'creditSoloCta',
    useCases: [
      { emoji: '📖', textKey: 'creditSoloUse1' },
      { emoji: '🌐', textKey: 'creditSoloUse2' },
    ],
    features: [
      { textKey: 'creditFeatureNoExpiry', included: true },
      { textKey: 'planFeaturePersonalLicense', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureAudiobook', included: true },
      { textKey: 'planFeatureShare', included: true },
      { textKey: 'planFeatureSupport247', included: true },
    ],
  },
  {
    slug: 'complete-work',
    nameKey: 'creditPackName',
    popular: true,
    labelKey: 'creditPackLabel',
    ctaKey: 'creditPackCta',
    useCases: [
      { emoji: '📖', textKey: 'creditPackUse1' },
      { emoji: '🎨', textKey: 'creditPackUse2' },
      { emoji: '🖼️', textKey: 'creditPackUse3' },
    ],
    features: [
      { textKey: 'creditFeatureNoExpiry', included: true },
      { textKey: 'planFeaturePersonalLicense', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureAudiobook', included: true },
      { textKey: 'planFeatureShare', included: true },
      { textKey: 'planFeatureSupport247', included: true },
    ],
  },
  {
    slug: 'bestseller',
    nameKey: 'creditBundleName',
    popular: false,
    labelKey: 'creditBundleLabel',
    ctaKey: 'creditBundleCta',
    useCases: [
      { emoji: '📖', textKey: 'creditBundleUse1' },
      { emoji: '🎨', textKey: 'creditBundleUse2' },
      { emoji: '🌍', textKey: 'creditBundleUse3' },
    ],
    features: [
      { textKey: 'creditFeatureNoExpiry', included: true },
      { textKey: 'planFeatureCommercialLicense', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureAudiobook', included: true },
      { textKey: 'creditFeatureFullEditor', included: true },
      { textKey: 'planFeatureShare', included: true },
      { textKey: 'planFeatureSupport247', included: true },
    ],
  },
]

// ─── Pure Credit Pack UI data (for dashboard buy-credits page) ───────────────

const PURE_CREDIT_PACK_UI: CreditPackUiData[] = [
  {
    slug: 'pack-100',
    nameKey: 'purePack100Name',
    popular: false,
    labelKey: 'purePack100Label',
    ctaKey: 'purePack100Cta',
    useCases: [
      { emoji: '📖', textKey: 'purePack100Use1' },
      { emoji: '🌐', textKey: 'purePack100Use2' },
    ],
    features: [
      { textKey: 'creditFeatureNoExpiry', included: true },
      { textKey: 'planFeaturePersonalLicense', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureSupport247', included: true },
    ],
  },
  {
    slug: 'pack-300',
    nameKey: 'purePack300Name',
    popular: true,
    labelKey: 'purePack300Label',
    ctaKey: 'purePack300Cta',
    useCases: [
      { emoji: '📖', textKey: 'purePack300Use1' },
      { emoji: '🎨', textKey: 'purePack300Use2' },
      { emoji: '🖼️', textKey: 'purePack300Use3' },
    ],
    features: [
      { textKey: 'creditFeatureNoExpiry', included: true },
      { textKey: 'planFeaturePersonalLicense', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'planFeatureSupport247', included: true },
    ],
  },
  {
    slug: 'pack-500',
    nameKey: 'purePack500Name',
    popular: false,
    labelKey: 'purePack500Label',
    ctaKey: 'purePack500Cta',
    useCases: [
      { emoji: '📖', textKey: 'purePack500Use1' },
      { emoji: '🎨', textKey: 'purePack500Use2' },
      { emoji: '🌍', textKey: 'purePack500Use3' },
    ],
    features: [
      { textKey: 'creditFeatureNoExpiry', included: true },
      { textKey: 'planFeatureCommercialLicense', included: true },
      { textKey: 'planFeatureDocxPdf', included: true },
      { textKey: 'planFeatureImages', included: true },
      { textKey: 'creditFeatureFullEditor', included: true },
      { textKey: 'planFeatureSupport247', included: true },
    ],
  },
]

// Fallback values for credit packs
const CREDIT_PACK_FALLBACKS: Record<string, { credits: number; price: number; fullPrice?: number }> = {
  'aspiring-work': { credits: 100, price: 19 },
  'complete-work': { credits: 400, price: 69, fullPrice: 77 },
  'bestseller': { credits: 1500, price: 249, fullPrice: 276 },
  'pack-100': { credits: 100, price: 20 },
  'pack-300': { credits: 300, price: 60 },
  'pack-500': { credits: 500, price: 100 },
}

function buildFromUiData(uiData: CreditPackUiData[], configPacks?: CreditPackConfig[]): CreditPack[] {
  return uiData.map((ui) => {
    const config = configPacks?.find((p) => p.slug === ui.slug)
    const fallback = CREDIT_PACK_FALLBACKS[ui.slug]

    const price = config ? config.priceCents / 100 : (fallback?.price ?? 0)
    const fullPrice = config?.fullPriceCents
      ? config.fullPriceCents / 100
      : fallback?.fullPrice

    return {
      id: ui.slug,
      slug: ui.slug,
      nameKey: ui.nameKey,
      credits: config?.credits ?? fallback?.credits ?? 100,
      price,
      fullPrice: fullPrice && fullPrice > price ? fullPrice : undefined,
      popular: ui.popular,
      labelKey: ui.labelKey,
      ctaKey: ui.ctaKey,
      useCases: ui.useCases,
      features: ui.features,
    }
  })
}

/**
 * Build branded CreditPack[] (landing page).
 */
export function buildCreditPacks(configPacks?: CreditPackConfig[]): CreditPack[] {
  return buildFromUiData(CREDIT_PACK_UI, configPacks)
}

/**
 * Build pure CreditPack[] (dashboard buy-credits page).
 */
export function buildPureCreditPacks(configPacks?: CreditPackConfig[]): CreditPack[] {
  return buildFromUiData(PURE_CREDIT_PACK_UI, configPacks)
}

// ─── Services ─────────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  { nameKey: 'serviceBook', costKey: 'BOOK_GENERATION', credits: 100 },
  { nameKey: 'serviceCover', costKey: 'ADDON_COVER', credits: 150 },
  { nameKey: 'serviceTranslation', costKey: 'ADDON_TRANSLATION', credits: 100 },
  { nameKey: 'serviceCoverTranslation', costKey: 'ADDON_COVER_TRANSLATION', credits: 100 },
  { nameKey: 'serviceImagePack', costKey: 'ADDON_IMAGES', credits: 150 },
  { nameKey: 'servicePublishStandard', costKey: 'ADDON_AMAZON_STANDARD', credits: 700 },
  { nameKey: 'servicePublishPremium', costKey: 'ADDON_AMAZON_PREMIUM', credits: 1000 },
]

/**
 * Build service list with credit costs from config store.
 */
export function buildServices(creditsCost?: Record<string, number>): Service[] {
  return SERVICES.map((s) => ({
    ...s,
    credits: creditsCost?.[s.costKey] ?? s.credits,
  }))
}

// ─── Calculator ───────────────────────────────────────────────────────────────

export const CALCULATOR_OPTIONS: CalculatorOption[] = [
  { labelKey: 'calc1Book', value: 1, recommendation: 'autor', recommendationLabelKey: 'planAutorName' },
  { labelKey: 'calc2to3Books', value: 3, recommendation: 'autor', recommendationLabelKey: 'planAutorName' },
  { labelKey: 'calc4to7Books', value: 7, recommendation: 'profissional', recommendationLabelKey: 'planProfissionalName' },
  { labelKey: 'calc8PlusBooks', value: 8, recommendation: 'bestseller', recommendationLabelKey: 'planBestsellerName' },
]

// ─── FAQ count (items are in i18n) ────────────────────────────────────────────

export const FAQ_COUNT = 10
