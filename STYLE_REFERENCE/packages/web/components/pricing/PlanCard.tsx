'use client'

import { motion } from 'framer-motion'
import { Plan, PlanFeature } from '@/lib/pricing-data'
import clsx from 'clsx'

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SoonBadge = () => (
  <span className="ml-auto flex-shrink-0 text-[10px] bg-gold-500/15 text-gold-400 border border-gold-500/20 px-1.5 py-0.5 rounded font-semibold tracking-wide">
    em breve
  </span>
)

// ─── Feature Row ─────────────────────────────────────────────────────────────

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {feature.soon ? (
        <svg className="w-4 h-4 text-gold-500/50 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : feature.included ? (
        <CheckIcon />
      ) : (
        <XIcon />
      )}
      <span className={clsx(
        'flex-1 leading-snug',
        feature.included ? 'text-cream-300' : feature.soon ? 'text-cream-500' : 'text-cream-500/50 line-through',
      )}>
        {feature.text}
      </span>
      {feature.soon && <SoonBadge />}
    </li>
  )
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan
  billing: 'annual' | 'monthly'
  isHighlighted: boolean
  savingsBadge?: string
}

export default function PlanCard({ plan, billing, isHighlighted, savingsBadge }: PlanCardProps) {
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
          ? 'bg-card-popular border border-gold-500/28 shadow-gold-md'
          : 'bg-white/[0.025] border border-white/[0.07] hover:border-white/[0.12]',
        isHighlighted && !isPopular && 'border-gold-500/25 shadow-gold-sm',
        'hover:shadow-card-hover',
      )}
    >
      {/* Top badges */}
      {(isPopular || savingsBadge) && (
        <div className="flex flex-col items-center gap-1.5 pt-4 pb-0">
          {isPopular && (
            <span className="inline-flex items-center gap-1.5 bg-gold-500 text-navy-900 text-xs font-bold px-4 py-1 rounded-full tracking-wide">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Mais Popular
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
        {/* Plan name */}
        <div className="mb-5">
          <h3 className={clsx(
            'font-playfair font-bold text-2xl mb-1.5',
            isPopular ? 'text-gold-400' : 'text-cream-200',
          )}>
            {plan.name}
          </h3>
          <p className="text-cream-400 text-sm font-medium">
            Até {plan.booksPerMonth} livros por mês · {plan.credits.toLocaleString('pt-BR')} créditos/mês
          </p>
        </div>

        {/* Price */}
        <div className="mb-2">
          {strikePrice !== null && (
            <p className="text-cream-400 text-sm line-through mb-0.5">
              ${strikePrice}/mês
            </p>
          )}
          <div className="flex items-end gap-1.5">
            <span className={clsx(
              'font-playfair font-bold leading-none',
              isPopular ? 'text-gold-400 text-5xl' : 'text-cream-200 text-4xl',
            )}>
              ${price}
            </span>
            <span className="text-cream-500 text-sm mb-1">/mês</span>
          </div>
          {billing === 'annual' && (
            <p className="text-cream-400 text-sm mt-1">
              Cobrança anual: ${plan.annualTotal}
            </p>
          )}
          {billing === 'monthly' && (
            <p className="text-gold-500/70 text-xs mt-1">
              💡 Anual: economize 35%
            </p>
          )}
        </div>

        {/* Divider */}
        <div className={clsx('my-5 h-px', isPopular ? 'bg-gold-500/15' : 'bg-white/[0.06]')} />

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {plan.features.map((feature, i) => (
            <FeatureRow key={i} feature={feature} />
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-6">
          <button
            className={clsx(
              'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]',
              isPopular
                ? 'bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-sm hover:shadow-gold-md'
                : 'bg-white/[0.07] hover:bg-white/[0.12] text-cream-200 border border-white/10 hover:border-white/20',
            )}
          >
            {plan.cta}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
