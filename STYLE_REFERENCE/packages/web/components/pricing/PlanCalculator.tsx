'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CALCULATOR_OPTIONS } from '@/lib/pricing-data'
import clsx from 'clsx'

interface PlanCalculatorProps {
  onRecommend: (planId: string | null) => void
}

export default function PlanCalculator({ onRecommend }: PlanCalculatorProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    setSelected(index)
    onRecommend(CALCULATOR_OPTIONS[index].recommendation)
  }

  const recommendation = selected !== null ? CALCULATOR_OPTIONS[selected] : null

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <p className="text-center text-cream-300 text-sm font-medium mb-5">
        Quantos livros você quer criar por mês?
      </p>

      {/* Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {CALCULATOR_OPTIONS.map((option, i) => (
          <button
            key={option.label}
            onClick={() => handleSelect(i)}
            className={clsx(
              'py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border',
              selected === i
                ? 'bg-gold-500 text-navy-900 border-gold-500 shadow-gold-sm'
                : 'bg-white/[0.04] text-cream-300 border-white/10 hover:border-white/20 hover:bg-white/[0.07]',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Recommendation */}
      <AnimatePresence mode="wait">
        {recommendation && (
          <motion.div
            key={recommendation.recommendation}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/[0.06]"
          >
            <p className="text-cream-300 text-sm">
              O plano{' '}
              <span className="text-gold-400 font-bold">{recommendation.recommendationLabel}</span>
              {' '}é ideal para você.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById(`plan-${recommendation.recommendation}`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                className="btn-primary text-sm py-2 px-4"
              >
                Ver {recommendation.recommendationLabel}
              </button>
              <button
                onClick={() => { setSelected(null); onRecommend(null) }}
                className="btn-secondary text-sm py-2 px-3"
              >
                Comparar todos
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
