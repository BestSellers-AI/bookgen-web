'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Plan, PlanFeature } from '@/lib/landing-pricing-data'
import clsx from 'clsx'

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4 dark:text-white/20 text-navy-900/20 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gold-500/50 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SoonBadge = ({ label }: { label: string }) => (
  <span className="ml-auto flex-shrink-0 text-[10px] bg-gold-500/15 text-gold-400 border border-gold-500/20 px-1.5 py-0.5 rounded font-semibold tracking-wide">
    {label}
  </span>
)

function FeatureRow({ feature, t }: { feature: PlanFeature; t: (key: string) => string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {feature.soon ? <ClockIcon /> : feature.included ? <CheckIcon /> : <XIcon />}
      <span className={clsx(
        'flex-1 leading-snug',
        feature.soon
          ? 'dark:text-cream-500 text-navy-600'
          : feature.included
            ? 'dark:text-cream-300 text-navy-800'
            : 'dark:text-cream-500/50 text-navy-500/50 line-through',
      )}>
        {t(feature.textKey)}
      </span>
      {feature.soon && <SoonBadge label={t('featureSoonBadge')} />}
    </li>
  )
}

interface PlanCardProps {
  plan: Plan
  billing: 'annual' | 'monthly'
  isHighlighted: boolean
  savingsBadge?: string
}

export default function PlanCard({ plan, billing, isHighlighted, savingsBadge }: PlanCardProps) {
  const t = useTranslations('landingV2.pricing')
  const price = billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice
  const strikePrice = billing === 'annual' ? plan.monthlyPrice : null
  const isPopular = plan.popular

  return (
    <motion.div
      layout
      animate={isHighlighted ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        'relative flex flex-col rounded-2xl transition-all duration-300 overflow-hidden',
        isPopular
          ? 'bg-card-popular dark:border-gold-500/28 border-gold-600/28 border shadow-gold-md'
          : 'dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] dark:hover:border-white/[0.12] hover:border-navy-900/[0.12]',
        isHighlighted && !isPopular && 'dark:border-gold-500/25 border-gold-600/25 shadow-gold-sm',
        'hover:shadow-card-hover',
      )}
    >
      {(isPopular || savingsBadge) && (
        <div className="flex flex-col items-center gap-1.5 pt-4 pb-0">
          {isPopular && (
            <span className="inline-flex items-center gap-1.5 bg-gold-500 text-navy-900 text-xs font-bold px-4 py-1 rounded-full tracking-wide">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {t('planBadgeMostPopular')}
            </span>
          )}
          {savingsBadge && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full tracking-wide">
              {savingsBadge}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 pt-5">
        <div className="mb-5">
          <h3 className={clsx(
            'font-playfair font-bold text-2xl mb-1.5',
            isPopular ? 'dark:text-gold-400 text-gold-700' : 'dark:text-cream-200 text-navy-900',
          )}>
            {t(plan.nameKey)}
          </h3>
          <p className="dark:text-cream-400 text-navy-700 text-sm font-medium">
            {t('upToBooksPerMonth', { count: plan.booksPerMonth, credits: plan.credits.toLocaleString() })}
          </p>
        </div>

        <div className="mb-2">
          {strikePrice !== null && (
            <p className="dark:text-cream-400 text-navy-500 text-sm line-through mb-0.5">
              ${strikePrice}{t('perMonth')}
            </p>
          )}
          <div className="flex items-end gap-1.5">
            <span className={clsx(
              'font-playfair font-bold leading-none',
              isPopular ? 'dark:text-gold-400 text-gold-700 text-5xl' : 'dark:text-cream-200 text-navy-900 text-4xl',
            )}>
              ${price}
            </span>
            <span className="dark:text-cream-500 text-navy-600 text-sm mb-1">{t('perMonth')}</span>
          </div>
          {billing === 'annual' && (
            <p className="dark:text-cream-400 text-navy-600 text-sm mt-1">
              {t('annualBilling', { total: plan.annualTotal })}
            </p>
          )}
          {billing === 'monthly' && (
            <p className="dark:text-gold-500/70 text-gold-600/70 text-xs mt-1">
              {t('annualHint')}
            </p>
          )}
        </div>

        <div className={clsx('my-5 h-px', isPopular ? 'dark:bg-gold-500/15 bg-gold-600/15' : 'dark:bg-white/[0.06] bg-navy-900/[0.06]')} />

        <ul className="flex flex-col gap-2.5 flex-1">
          {plan.features.map((feature, i) => (
            <FeatureRow key={i} feature={feature} t={t} />
          ))}
        </ul>

        <div className="mt-6">
          <button
            className={clsx(
              'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]',
              isPopular
                ? 'bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-sm hover:shadow-gold-md'
                : 'dark:bg-white/[0.07] bg-navy-900/[0.07] dark:hover:bg-white/[0.12] hover:bg-navy-900/[0.12] dark:text-cream-200 text-navy-900 border dark:border-white/10 border-navy-900/10 dark:hover:border-white/20 hover:border-navy-900/20',
            )}
          >
            {t(plan.ctaKey)}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
