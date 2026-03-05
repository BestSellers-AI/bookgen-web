// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  textKey: string
  included: boolean
  soon?: boolean
}

export interface Plan {
  id: string
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
  nameKey: string
  credits: number
  price: number
  popular: boolean
  labelKey: string
  useCases: { emoji: string; textKey: string }[]
  features: PlanFeature[]
  ctaKey: string
}

export interface Service {
  nameKey: string
  credits: number
}

export interface CalculatorOption {
  labelKey: string
  value: number
  recommendation: string
  recommendationLabelKey: string
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'autor',
    nameKey: 'planAutorName',
    credits: 300,
    booksPerMonth: 3,
    monthlyPrice: 29,
    annualMonthlyPrice: 19,
    annualTotal: 228,
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
    id: 'bestseller',
    nameKey: 'planBestsellerName',
    credits: 750,
    booksPerMonth: 7,
    monthlyPrice: 59,
    annualMonthlyPrice: 39,
    annualTotal: 468,
    popular: true,
    badgeKey: 'planBadgeMostPopular',
    ctaKey: 'planBestsellerCta',
    highlightKey: 'planBestsellerHighlight',
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
    id: 'editora',
    nameKey: 'planEliteName',
    credits: 2000,
    booksPerMonth: 20,
    monthlyPrice: 139,
    annualMonthlyPrice: 89,
    annualTotal: 1068,
    popular: false,
    ctaKey: 'planEliteCta',
    highlightKey: 'planEliteHighlight',
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

// ─── Credit Packs ─────────────────────────────────────────────────────────────

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'solo',
    nameKey: 'creditSoloName',
    credits: 100,
    price: 19,
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
    id: 'pack',
    nameKey: 'creditPackName',
    credits: 400,
    price: 69,
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
    id: 'bundle',
    nameKey: 'creditBundleName',
    credits: 1500,
    price: 249,
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

// ─── Services ─────────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  { nameKey: 'serviceBook', credits: 100 },
  { nameKey: 'serviceCover', credits: 150 },
  { nameKey: 'serviceTranslation', credits: 100 },
  { nameKey: 'serviceCoverTranslation', credits: 150 },
  { nameKey: 'serviceImagePack', credits: 150 },
  { nameKey: 'servicePublishStandard', credits: 700 },
  { nameKey: 'servicePublishPremium', credits: 1000 },
]

// ─── Calculator ───────────────────────────────────────────────────────────────

export const CALCULATOR_OPTIONS: CalculatorOption[] = [
  { labelKey: 'calc1Book', value: 1, recommendation: 'autor', recommendationLabelKey: 'planAutorName' },
  { labelKey: 'calc2to3Books', value: 3, recommendation: 'autor', recommendationLabelKey: 'planAutorName' },
  { labelKey: 'calc4to7Books', value: 7, recommendation: 'bestseller', recommendationLabelKey: 'planBestsellerName' },
  { labelKey: 'calc8PlusBooks', value: 8, recommendation: 'editora', recommendationLabelKey: 'planEliteName' },
]

// ─── FAQ count (items are in i18n) ────────────────────────────────────────────

export const FAQ_COUNT = 10
