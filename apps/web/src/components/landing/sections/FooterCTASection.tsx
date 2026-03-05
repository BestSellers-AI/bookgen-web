'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function FooterCTASection() {
  const t = useTranslations('landingV2.footerCta')

  const trustItems = [t('trust1'), t('trust2'), t('trust3'), t('trust4')]

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 dark:bg-navy-950 bg-cream-100" />
      <div className="absolute inset-0 bg-grid dark:opacity-60 opacity-30" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] dark:bg-gold-500/8 bg-gold-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 h-px dark:bg-gradient-to-r dark:from-transparent dark:via-gold-500/30 dark:to-transparent bg-gradient-to-r from-transparent via-gold-600/30 to-transparent" />

      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-3xl mx-auto"
        >
          <span className="section-badge mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            {t('badge')}
          </span>

          <h2 className="font-playfair font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight">
            <span className="dark:text-cream-200 text-navy-900">{t('headline1')}</span>
            <br />
            <span className="italic text-gradient-gold">{t('headline2')}</span>
          </h2>

          <p className="mt-6 text-lg dark:text-cream-400 text-navy-700 max-w-xl leading-relaxed">
            {t('subtitle')}
          </p>

          <Link
            href="/auth/register"
            className="btn-primary mt-10 text-base px-10 py-4 glow-gold"
          >
            {t('cta')}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs dark:text-cream-500 text-navy-600">
            {trustItems.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
