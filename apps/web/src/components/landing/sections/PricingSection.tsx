'use client'

import { useState } from 'react'
import * as m from 'motion/react-m'
import { AnimatePresence } from 'motion/react'
import { useTranslations } from 'next-intl'
import PlanCard from '@/components/landing/pricing/PlanCard'
import CreditCard from '@/components/landing/pricing/CreditCard'
import PlanCalculator from '@/components/landing/pricing/PlanCalculator'
import EmailPromptDialog from '@/components/landing/pricing/EmailPromptDialog'
import { buildPlans, buildCreditPacks, buildServices } from '@/lib/landing-pricing-data'
import { useConfigStore } from '@/stores/config-store'
import { useAuth } from '@/hooks/use-auth'
import { checkoutApi } from '@/lib/api/checkout'
import { toast } from 'sonner'
import clsx from 'clsx'
import { trackInitiateCheckout, generateEventId, getFbCookies } from '@/lib/fb-pixel'

type PricingTab = 'plans' | 'credits'
type BillingPeriod = 'annual' | 'monthly'

export default function PricingSection() {
  const t = useTranslations('landingV2.pricing')
  const [activeTab, setActiveTab] = useState<PricingTab>('plans')
  const [billing, setBilling] = useState<BillingPeriod>('annual')
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const [pendingBillingInterval, setPendingBillingInterval] = useState<'monthly' | 'annual' | undefined>(undefined)

  const { user } = useAuth()

  // Pull dynamic data from config store (admin-managed)
  const configPlans = useConfigStore((s) => s.config?.subscriptionPlans)
  const configPacks = useConfigStore((s) => s.config?.creditPacks)
  const configCreditsCost = useConfigStore((s) => s.config?.creditsCost)

  // Merge config store data with static UI data
  const plans = buildPlans(configPlans)
  const creditPacks = buildCreditPacks(configPacks)
  const services = buildServices(configCreditsCost)

  const handleBuy = (slug: string, billingInterval?: 'monthly' | 'annual') => {
    if (user) {
      handleAuthenticatedBuy(slug, billingInterval)
    } else {
      setPendingSlug(slug)
      setPendingBillingInterval(billingInterval)
      setEmailDialogOpen(true)
    }
  }

  const handleAuthenticatedBuy = async (slug: string, billingInterval?: 'monthly' | 'annual') => {
    setLoadingSlug(slug)
    try {
      const plan = plans.find((p) => planSlugMap[p.id] === slug)
      const pack = creditPacks.find((p) => p.slug === slug)
      trackInitiateCheckout({
        content_name: plan?.nameKey ?? pack?.nameKey ?? slug,
        content_category: plan ? 'subscription' : 'credit_pack',
        content_ids: [slug],
        value: plan
          ? (billingInterval === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice) / 100
          : pack ? pack.price / 100 : 0,
        currency: 'USD',
        num_items: 1,
      }, generateEventId())

      const { fbp, fbc } = getFbCookies()
      const res = await checkoutApi.createSession({ productSlug: slug, billingInterval, fbp, fbc })
      window.location.href = res.url
    } catch {
      toast.error(t('purchaseError'))
      setLoadingSlug(null)
    }
  }

  const handleGuestBuy = async (email: string) => {
    if (!pendingSlug) return
    setLoadingSlug(pendingSlug)
    try {
      const plan = plans.find((p) => planSlugMap[p.id] === pendingSlug)
      const pack = creditPacks.find((p) => p.slug === pendingSlug)
      trackInitiateCheckout({
        content_name: plan?.nameKey ?? pack?.nameKey ?? pendingSlug,
        content_category: plan ? 'subscription' : 'credit_pack',
        content_ids: [pendingSlug],
        value: plan
          ? (pendingBillingInterval === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice) / 100
          : pack ? pack.price / 100 : 0,
        currency: 'USD',
        num_items: 1,
      }, generateEventId())

      const { fbp, fbc } = getFbCookies()
      const res = await checkoutApi.createGuestSession({
        productSlug: pendingSlug,
        email,
        billingInterval: pendingBillingInterval,
        fbp,
        fbc,
      })
      window.location.href = res.url
    } catch {
      toast.error(t('purchaseError'))
      setLoadingSlug(null)
    }
  }

  const comparisonRows = [
    { label: t('whySubRow1Label'), price: t('whySubRow1Price'), savings: t('whySubRow1Savings'), highlight: false },
    { label: t('whySubRow2Label'), price: t('whySubRow2Price'), savings: t('whySubRow2Savings'), highlight: false },
    { label: t('whySubRow3Label'), price: t('whySubRow3Price'), savings: t('whySubRow3Savings'), highlight: true },
    { label: t('whySubRow4Label'), price: t('whySubRow4Price'), savings: t('whySubRow4Savings'), highlight: false },
  ]

  const savingsBadges: Record<string, string> = {
    profissional: t('savingsBestseller'),
    bestseller: t('savingsElite'),
  }

  // Map plan UI id to a subscription product slug for checkout
  const planSlugMap: Record<string, string> = {
    autor: 'plan-aspirante',
    profissional: 'plan-profissional',
    bestseller: 'plan-bestseller',
  }

  return (
    <section id="planos" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-900 dark:via-navy-950 dark:to-navy-900 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-50 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px dark:bg-gradient-to-r dark:from-transparent dark:via-gold-500/20 dark:to-transparent bg-gradient-to-r from-transparent via-gold-600/20 to-transparent" />

      <div className="section-container relative">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <span className="section-badge mb-5">{t('badge')}</span>
          <h2 className="font-playfair font-bold text-4xl md:text-5xl dark:text-cream-200 text-navy-900 mt-4 leading-tight">
            {t('headline1')}{' '}
            <span className="italic text-gradient-gold">{t('headlineHighlight')}</span>
          </h2>
          <p className="dark:text-cream-400 text-navy-700 mt-4 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </m.div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex dark:bg-navy-800/80 bg-cream-200/80 backdrop-blur-sm rounded-2xl p-1.5 border dark:border-white/[0.08] border-navy-900/[0.08]">
            {(['plans', 'credits'] as PricingTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-7 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  activeTab === tab
                    ? 'bg-gold-500 text-navy-900 shadow-gold-sm'
                    : 'dark:text-cream-400 text-navy-700 dark:hover:text-cream-200 hover:text-navy-900',
                )}
              >
                {tab === 'plans' ? t('tabPlans') : t('tabCredits')}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'plans' ? (
            <m.div
              key="plans"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Billing Toggle */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <span className={clsx(
                  'text-sm transition-colors',
                  billing === 'monthly' ? 'dark:text-cream-200 text-navy-900 font-medium' : 'dark:text-cream-500 text-navy-600',
                )}>
                  {t('monthly')}
                </span>

                <button
                  onClick={() => setBilling(b => b === 'annual' ? 'monthly' : 'annual')}
                  className="relative w-14 h-7 dark:bg-navy-700 bg-cream-300 rounded-full border dark:border-white/10 border-navy-900/10 transition-colors dark:hover:border-white/20 hover:border-navy-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  aria-label="Toggle billing period"
                >
                  <m.div
                    animate={{ x: billing === 'annual' ? 28 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-6 h-6 bg-gold-500 rounded-full shadow-gold-sm"
                  />
                </button>

                <span className={clsx(
                  'text-sm transition-colors flex items-center gap-2',
                  billing === 'annual' ? 'dark:text-cream-200 text-navy-900 font-medium' : 'dark:text-cream-500 text-navy-600',
                )}>
                  {t('annual')}
                  <span className="dark:bg-gold-500/15 bg-gold-600/15 border dark:border-gold-500/25 border-gold-600/25 dark:text-gold-400 text-gold-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                    {t('annualBadge')}
                  </span>
                </span>
              </div>

              {/* <PlanCalculator onRecommend={setHighlightedPlan} /> */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, i) => (
                  <m.div
                    key={plan.id}
                    id={`plan-${plan.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <PlanCard
                      plan={plan}
                      billing={billing}
                      isHighlighted={highlightedPlan === plan.id}
                      savingsBadge={savingsBadges[plan.id]}
                      onBuy={() => handleBuy(planSlugMap[plan.id], billing)}
                      loading={loadingSlug === planSlugMap[plan.id]}
                    />
                  </m.div>
                ))}
              </div>

              {/* Enterprise CTA */}
              <div className="mt-5 glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="dark:text-cream-300 text-navy-800 font-medium">{t('enterpriseTitle')}</p>
                  <p className="dark:text-cream-500 text-navy-600 text-sm mt-0.5">{t('enterpriseSubtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.$chatwoot?.toggle?.('open')}
                  className="btn-secondary text-sm py-2.5 flex-shrink-0"
                >
                  {t('enterpriseCta')}
                </button>
              </div>

              {/* Why Subscribe */}
              <div className="mt-20">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-8"
                >
                  <h3 className="font-playfair font-bold text-2xl md:text-3xl dark:text-cream-200 text-navy-900">
                    {t('whySubscribeTitle')}
                  </h3>
                  <p className="dark:text-cream-500 text-navy-600 text-sm mt-2">{t('whySubscribeSubtitle')}</p>
                </m.div>

                <div className="glass-card overflow-hidden max-w-2xl mx-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-white/[0.06] border-navy-900/[0.06] dark:bg-white/[0.02] bg-navy-900/[0.02]">
                        <th className="text-left py-3 px-5 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{t('whySubColPlan')}</th>
                        <th className="text-right py-3 px-5 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{t('whySubColPerBook')}</th>
                        <th className="text-right py-3 px-5 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">{t('whySubColSavings')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr
                          key={row.label}
                          className={clsx(
                            'border-b dark:border-white/[0.04] border-navy-900/[0.04] last:border-0',
                            row.highlight ? 'dark:bg-gold-500/[0.06] bg-gold-600/[0.06]' : 'dark:hover:bg-white/[0.02] hover:bg-navy-900/[0.02]',
                          )}
                        >
                          <td className={clsx(
                            'py-3.5 px-5',
                            row.highlight ? 'dark:text-gold-400 text-gold-700 font-semibold' : 'dark:text-cream-300 text-navy-800',
                          )}>
                            {row.label}
                            {row.highlight && (
                              <svg className="w-3.5 h-3.5 inline-block ml-1.5 mb-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </td>
                          <td className={clsx(
                            'py-3.5 px-5 text-right font-mono font-bold',
                            row.highlight ? 'dark:text-gold-400 text-gold-700 text-base' : 'dark:text-cream-200 text-navy-900',
                          )}>
                            {row.price}
                          </td>
                          <td className={clsx(
                            'py-3.5 px-5 text-right text-xs hidden sm:table-cell',
                            row.highlight ? 'dark:text-gold-400 text-gold-700 font-semibold' : 'dark:text-cream-500 text-navy-600',
                          )}>
                            {row.savings}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </m.div>
          ) : (
            <m.div
              key="credits"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-6">
                <p className="dark:text-cream-400 text-navy-700 text-sm">
                  {t('creditsHeader')}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2.5 dark:bg-gold-500/[0.08] bg-gold-600/[0.08] border dark:border-gold-500/20 border-gold-600/20 rounded-xl px-5 py-3 text-sm">
                  <span className="dark:text-gold-400 text-gold-600 text-base">💡</span>
                  <span className="dark:text-cream-300 text-navy-800">
                    {t('creditsBanner')}{' '}
                    <strong className="dark:text-gold-400 text-gold-700">{t('creditsBannerBold')}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditPacks.map((pack, i) => (
                  <m.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <CreditCard
                      pack={pack}
                      onBuy={() => handleBuy(pack.slug)}
                      loading={loadingSlug === pack.slug}
                    />
                  </m.div>
                ))}
              </div>

              {/* Services Table */}
              <div className="mt-20">
                <div className="text-center mb-8">
                  <h3 className="font-playfair font-bold text-2xl md:text-3xl dark:text-cream-200 text-navy-900">
                    {t('servicesTitle')}
                  </h3>
                  <p className="dark:text-cream-500 text-navy-600 text-sm mt-2">{t('servicesSubtitle')}</p>
                </div>

                <div className="glass-card overflow-hidden max-w-lg mx-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-white/[0.06] border-navy-900/[0.06] dark:bg-white/[0.02] bg-navy-900/[0.02]">
                        <th className="text-left py-3 px-6 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{t('servicesColName')}</th>
                        <th className="text-right py-3 px-6 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{t('servicesColCredits')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr
                          key={service.nameKey}
                          className="border-b dark:border-white/[0.04] border-navy-900/[0.04] last:border-0 dark:hover:bg-white/[0.02] hover:bg-navy-900/[0.02] transition-colors"
                        >
                          <td className="py-3.5 px-6 dark:text-cream-300 text-navy-800">{t(service.nameKey)}</td>
                          <td className="py-3.5 px-6 text-right font-mono dark:text-gold-400 text-gold-700 font-bold">{service.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <EmailPromptDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSubmit={handleGuestBuy}
        loading={loadingSlug !== null}
      />
    </section>
  )
}
