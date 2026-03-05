'use client'

import { useTranslations } from 'next-intl'
import type { CreditPack, PlanFeature } from '@/lib/landing-pricing-data'
import clsx from 'clsx'

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

function FeatureRow({ feature, t }: { feature: PlanFeature; t: (key: string) => string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <CheckIcon />
      <span className="flex-1 leading-snug dark:text-cream-300 text-navy-800">
        {t(feature.textKey)}
      </span>
    </li>
  )
}

interface CreditCardProps {
  pack: CreditPack
}

export default function CreditCard({ pack }: CreditCardProps) {
  const t = useTranslations('landingV2.pricing')
  const isPopular = pack.popular

  return (
    <div className={clsx(
      'relative flex flex-col rounded-2xl transition-all duration-300 overflow-hidden hover:shadow-card-hover',
      isPopular
        ? 'bg-card-popular dark:border-gold-500/28 border-gold-600/28 border shadow-gold-md'
        : 'dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] dark:hover:border-white/[0.12] hover:border-navy-900/[0.12]',
    )}>
      {isPopular && (
        <div className="flex justify-center pt-4">
          <span className="inline-flex items-center gap-1.5 bg-gold-500 text-navy-900 text-xs font-bold px-4 py-1 rounded-full tracking-wide">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('planBadgeMostPopular')}
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 pt-5">
        <div className="mb-4">
          <h3 className={clsx(
            'font-playfair font-bold text-2xl mb-0.5',
            isPopular ? 'dark:text-gold-400 text-gold-700' : 'dark:text-cream-200 text-navy-900',
          )}>
            {t(pack.nameKey)}
          </h3>
          <p className="dark:text-cream-500 text-navy-600 text-xs">{t(pack.labelKey)}</p>
        </div>

        <div className="mb-4">
          <p className={clsx(
            'font-semibold text-sm mb-1',
            isPopular ? 'dark:text-gold-500 text-gold-600' : 'dark:text-cream-400 text-navy-700',
          )}>
            {pack.credits.toLocaleString()} {t('tabCredits').toLowerCase()}
          </p>
          <div className="flex items-end gap-1.5">
            <span className={clsx(
              'font-playfair font-bold text-4xl leading-none',
              isPopular ? 'dark:text-gold-400 text-gold-700' : 'dark:text-cream-200 text-navy-900',
            )}>
              ${pack.price}
            </span>
          </div>
          <p className="dark:text-cream-500 text-navy-600 text-xs mt-1">{t('creditsSinglePayment')}</p>
        </div>

        <div className={clsx(
          'rounded-xl p-4 mb-5',
          isPopular ? 'dark:bg-gold-500/[0.07] bg-gold-600/[0.07] border dark:border-gold-500/15 border-gold-600/15' : 'dark:bg-white/[0.03] bg-navy-900/[0.03] border dark:border-white/[0.06] border-navy-900/[0.06]',
        )}>
          <p className="dark:text-cream-400 text-navy-700 text-xs font-semibold uppercase tracking-wider mb-3">
            {t('creditsCreateWith', { credits: pack.credits })}
          </p>
          <ul className="flex flex-col gap-2">
            {pack.useCases.map((uc, i) => (
              <li key={i} className="flex items-center gap-2 text-sm dark:text-cream-300 text-navy-800">
                <span className="text-base leading-none">{uc.emoji}</span>
                <span>{t(uc.textKey)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={clsx('mb-4 h-px', isPopular ? 'dark:bg-gold-500/15 bg-gold-600/15' : 'dark:bg-white/[0.06] bg-navy-900/[0.06]')} />

        <ul className="flex flex-col gap-2.5 flex-1">
          {pack.features.map((feature, i) => (
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
            {t(pack.ctaKey)}
          </button>
        </div>
      </div>
    </div>
  )
}
