'use client'

import { useState, useEffect } from 'react'
import * as m from 'motion/react-m'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return

    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, 80)
    return () => clearTimeout(timeout)
  }, [started, displayed, text])

  return (
    <>
      {displayed}
      <span
        className={`inline-block w-[3px] h-[0.8em] bg-gold-500 ml-0.5 align-baseline ${
          displayed.length >= text.length ? 'animate-blink' : ''
        }`}
      />
    </>
  )
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

export default function HeroSection() {
  const t = useTranslations('landingV2.hero')

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
    { value: t('stat4Value'), label: t('stat4Label') },
  ]

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-950 dark:via-navy-900 dark:to-navy-900 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-50" />
      <div className="absolute inset-0 bg-hero-radial" />
      <div className="absolute inset-0 bg-grid dark:opacity-100 opacity-40" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] dark:bg-gold-500/5 bg-gold-500/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="section-container relative z-10 flex flex-col items-center text-center pt-6 pb-16 md:pt-10 md:pb-24">
        <m.div {...fadeUp(0.1)}>
          <span className="section-badge mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {t('badge')}
          </span>
        </m.div>

        <m.h1
          {...fadeUp(0.2)}
          className="font-playfair font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight max-w-5xl"
        >
          {t('headlinePre')}{' '}
          <span className="italic text-gradient-gold">
            <TypingText text={t('headlineHighlight')} delay={600} />
          </span>
          <br />
          <span className="dark:text-cream-200 text-navy-900">{t('headlinePost')}</span>
        </m.h1>

        <m.p
          {...fadeUp(0.3)}
          className="mt-6 text-lg md:text-xl dark:text-cream-400 text-navy-700 max-w-2xl leading-relaxed"
        >
          {t('subtitle1')}
          <br className="hidden sm:block" />
          {t('subtitle2')}
        </m.p>

        <m.div
          {...fadeUp(0.4)}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 glow-gold">
            {t('ctaPrimary')}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a href="#como-funciona" className="btn-secondary text-base px-7 py-3.5">
            {t('ctaSecondary')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </m.div>

        <m.p {...fadeUp(0.5)} className="mt-5 text-xs dark:text-cream-500 text-navy-600">
          {t('trustLine')}
        </m.p>

        {/* capas */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 w-full max-w-5xl"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
              <m.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.9 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="relative aspect-[3/4.5] overflow-hidden rounded-xl dark:bg-navy-800/50 bg-cream-200/50 border dark:border-white/[0.07] border-navy-900/[0.07] hover:scale-[1.03] transition-transform duration-300"
              >
                <Image
                  src={`/lp/hero/${n}.png`}
                  alt={`AI generated book cover ${n}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 45vw, 22vw"
                />
              </m.div>
            ))}
          </div>
        </m.div>

        {/* dados */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 w-full max-w-3xl"
        >
          <div className="glass-card px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x dark:divide-white/[0.07] divide-navy-900/[0.07]">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center gap-0.5">
                <span className="font-playfair font-bold text-2xl md:text-3xl dark:text-gold-400 text-gold-600">
                  {stat.value}
                </span>
                <span className="text-xs dark:text-cream-500 text-navy-600">{stat.label}</span>
              </div>
            ))}
          </div>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-10 bg-gradient-to-b dark:from-gold-500/30 from-gold-600/30 to-transparent" />
      </m.div>
    </section>
  )
}
