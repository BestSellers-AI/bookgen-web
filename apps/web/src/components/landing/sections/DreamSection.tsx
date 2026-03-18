'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const bookColors = [
  { from: '#1a1060', to: '#6d28d9' },
  { from: '#064e3b', to: '#059669' },
  { from: '#7c2d12', to: '#ea580c' },
  { from: '#1e3a5f', to: '#2563eb' },
  { from: '#4a1942', to: '#a21caf' },
  { from: '#1c1917', to: '#ca8a04' },
  { from: '#0f3460', to: '#0ea5e9' },
  { from: '#14532d', to: '#16a34a' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

function BookCard({ title, genre, from, to }: { title: string; genre: string; from: string; to: string }) {
  return (
    <div className="flex-shrink-0 w-[120px] mx-3 select-none">
      <div
        className="w-[120px] h-[170px] rounded-r-lg rounded-l-sm relative overflow-hidden shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <p className="text-white/90 text-[10px] font-bold leading-tight whitespace-pre-line">
            {title}
          </p>
          <p className="text-white/50 text-[8px] uppercase tracking-wider font-semibold">
            {genre}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DreamSection() {
  const t = useTranslations('landingV2.dream')

  const books = bookColors.map((color, i) => ({
    title: t(`book${i + 1}Title`),
    genre: t(`book${i + 1}Genre`),
    ...color,
  }))
  const allBooks = [...books, ...books]

  const steps = [
    { icon: '💡', label: t('step1') },
    { icon: '✍️', label: t('step2') },
    { icon: '🌍', label: t('step3') },
    { icon: '📦', label: t('step4') },
  ]

  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-900 dark:to-navy-950 bg-gradient-to-b from-cream-50 to-cream-100" />
      <div className="absolute inset-0 bg-grid dark:opacity-40 opacity-20" />

      <div className="section-container relative z-10">
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] max-w-3xl mx-auto">
            {t('headline1')}{' '}
            <span className="italic text-gradient-gold">{t('headlineHighlight')}</span>
            <br />
            <span className="dark:text-cream-200 text-navy-900">{t('headline2')}</span>
          </h2>
          <p className="mt-5 dark:text-cream-400 text-navy-700 text-lg max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          {...fadeUp(0.1)}
          className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-14"
        >
          <div className="glass-card p-6 dark:border-white/[0.06] border-navy-900/[0.06]">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{t('typeAEmoji')}</span>
              <div>
                <p className="dark:text-cream-300 text-navy-800 text-sm font-semibold mb-1">{t('typeATitle')}</p>
                <p className="dark:text-cream-500 text-navy-600 text-sm leading-relaxed">
                  {t('typeADesc')}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 dark:border-gold-500/20 border-gold-600/20 dark:bg-gold-500/[0.03] bg-gold-600/[0.03]">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{t('typeBEmoji')}</span>
              <div>
                <p className="dark:text-gold-400 text-gold-600 text-sm font-semibold mb-1">{t('typeBTitle')}</p>
                <p className="dark:text-cream-400 text-navy-700 text-sm leading-relaxed">
                  {t('typeBDesc')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="flex items-center justify-center gap-0 mb-16 overflow-x-auto pb-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2 px-4 sm:px-6">
                <div className="w-12 h-12 rounded-full dark:bg-navy-800 bg-cream-200 border dark:border-white/10 border-navy-900/10 flex items-center justify-center text-2xl shadow-lg">
                  {step.icon}
                </div>
                <span className="dark:text-cream-400 text-navy-700 text-xs font-medium whitespace-nowrap">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 w-8 sm:w-12 h-px dark:bg-gradient-to-r dark:from-white/20 dark:to-gold-500/40 bg-gradient-to-r from-navy-900/20 to-gold-600/40 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full dark:bg-gold-500/60 bg-gold-600/60" />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* <div className="relative w-full overflow-hidden mb-14">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 dark:bg-gradient-to-r dark:from-navy-950 bg-gradient-to-r from-cream-100 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 dark:bg-gradient-to-l dark:from-navy-950 bg-gradient-to-l from-cream-100 to-transparent pointer-events-none" />

        <motion.div
          className="flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {allBooks.map((book, i) => (
            <BookCard key={i} title={book.title} genre={book.genre} from={book.from} to={book.to} />
          ))}
        </motion.div>
      </div> */}

      <div className="relative z-10 text-center">
        <p className="dark:text-cream-500 text-navy-600 text-sm mb-4">
          {t('microCtaText')}
        </p>
        <a
          href="#planos"
          className="inline-flex items-center gap-2 dark:text-gold-400 text-gold-600 dark:hover:text-gold-300 hover:text-gold-700 font-semibold text-sm transition-colors"
        >
          {t('microCtaLink')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </section>
  )
}
