'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CALCULATOR_OPTIONS } from '@/lib/landing-pricing-data'
import clsx from 'clsx'

interface PlanCalculatorProps {
  onRecommend: (planId: string | null) => void
}

export default function PlanCalculator({ onRecommend }: PlanCalculatorProps) {
  const t = useTranslations('landingV2.pricing')
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    setSelected(index)
    onRecommend(CALCULATOR_OPTIONS[index].recommendation)
  }

  const recommendation = selected !== null ? CALCULATOR_OPTIONS[selected] : null

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <p className="text-center dark:text-cream-300 text-navy-800 text-sm font-medium mb-5">
        {t('calculatorQuestion')}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {CALCULATOR_OPTIONS.map((option, i) => (
          <button
            key={option.labelKey}
            onClick={() => handleSelect(i)}
            className={clsx(
              'py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border',
              selected === i
                ? 'bg-gold-500 text-navy-900 border-gold-500 shadow-gold-sm'
                : 'dark:bg-white/[0.04] bg-navy-900/[0.04] dark:text-cream-300 text-navy-800 dark:border-white/10 border-navy-900/10 dark:hover:border-white/20 hover:border-navy-900/20 dark:hover:bg-white/[0.07] hover:bg-navy-900/[0.07]',
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {recommendation && (
          <motion.div
            key={recommendation.recommendation}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t dark:border-white/[0.06] border-navy-900/[0.06]"
          >
            <p className="dark:text-cream-300 text-navy-800 text-sm">
              {t('calculatorRecommend', { plan: t(recommendation.recommendationLabelKey) })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById(`plan-${recommendation.recommendation}`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                className="btn-primary text-sm py-2 px-4"
              >
                {t('calculatorView', { plan: t(recommendation.recommendationLabelKey) })}
              </button>
              <button
                onClick={() => { setSelected(null); onRecommend(null) }}
                className="btn-secondary text-sm py-2 px-3"
              >
                {t('calculatorCompare')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
