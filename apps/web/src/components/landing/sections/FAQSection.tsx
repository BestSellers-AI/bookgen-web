'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { FAQ_COUNT } from '@/lib/landing-pricing-data'
import clsx from 'clsx'

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={clsx(
        'border-b dark:border-white/[0.07] border-navy-900/[0.07] transition-colors duration-200',
        isOpen && 'dark:border-gold-500/20 border-gold-600/20',
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className={clsx(
          'font-medium text-sm md:text-base leading-snug transition-colors duration-200',
          isOpen ? 'dark:text-gold-400 text-gold-700' : 'dark:text-cream-200 text-navy-900 dark:group-hover:text-cream-100 group-hover:text-navy-800',
        )}>
          {question}
        </span>
        <span className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300',
          isOpen
            ? 'dark:bg-gold-500/20 bg-gold-600/20 dark:border-gold-500/40 border-gold-600/40 rotate-45 dark:text-gold-400 text-gold-700'
            : 'dark:border-white/15 border-navy-900/15 dark:text-cream-400 text-navy-700 dark:group-hover:border-white/30 group-hover:border-navy-900/30',
        )}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm dark:text-cream-400 text-navy-700 leading-relaxed pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQSection() {
  const t = useTranslations('landingV2.faq')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqItems = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`q${i + 1}`),
    answer: t(`a${i + 1}`),
  }))

  return (
    <section id="faq" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-900 dark:via-navy-950/30 dark:to-navy-900 bg-gradient-to-b from-cream-50 via-cream-100/30 to-cream-50 pointer-events-none" />

      <div className="section-container relative">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="section-badge mb-5">{t('badge')}</span>
            <h2 className="font-playfair font-bold text-4xl md:text-5xl dark:text-cream-200 text-navy-900 mt-4">
              {t('headline1')}{' '}
              <span className="italic text-gradient-gold">{t('headlineHighlight')}</span>
            </h2>
            <p className="dark:text-cream-400 text-navy-700 mt-4">
              {t('contactPrompt')}{' '}
              <a href="mailto:suporte@bestsellers.ai" className="dark:text-gold-400 text-gold-600 dark:hover:text-gold-300 hover:text-gold-700 underline underline-offset-2">
                {t('contactLink')}
              </a>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card px-6 md:px-8"
          >
            {faqItems.map((item, i) => (
              <FAQItem
                key={i}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
