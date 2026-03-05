'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FAQ_ITEMS } from '@/lib/pricing-data'
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
        'border-b border-white/[0.07] transition-colors duration-200',
        isOpen && 'border-gold-500/20',
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className={clsx(
          'font-medium text-sm md:text-base leading-snug transition-colors duration-200',
          isOpen ? 'text-gold-400' : 'text-cream-200 group-hover:text-cream-100',
        )}>
          {question}
        </span>
        <span className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300',
          isOpen
            ? 'bg-gold-500/20 border-gold-500/40 rotate-45 text-gold-400'
            : 'border-white/15 text-cream-400 group-hover:border-white/30',
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
            <p className="pb-5 text-sm text-cream-400 leading-relaxed pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950/30 to-navy-900 pointer-events-none" />

      <div className="section-container relative">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="section-badge mb-5">FAQ</span>
            <h2 className="font-playfair font-bold text-4xl md:text-5xl text-cream-200 mt-4">
              Perguntas{' '}
              <span className="italic text-gradient-gold">frequentes</span>
            </h2>
            <p className="text-cream-400 mt-4">
              Não encontrou o que procura?{' '}
              <a href="mailto:suporte@bestsellers.ai" className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
                Fale conosco
              </a>
            </p>
          </motion.div>

          {/* FAQ Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card px-6 md:px-8 divide-y-0"
          >
            {FAQ_ITEMS.map((item, i) => (
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
