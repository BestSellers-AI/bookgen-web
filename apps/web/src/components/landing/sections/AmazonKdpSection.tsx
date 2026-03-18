'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

export default function AmazonKdpSection() {
  const t = useTranslations('landingV2.amazonKdp')

  const photos = [
    '/lp/amazon/1.jpeg',
    '/lp/amazon/2.jpeg',
    '/lp/amazon/3.jpeg',
    '/lp/amazon/4.jpeg',
  ]

  const features = [
    t('feature1'),
    t('feature2'),
    t('feature3'),
    t('feature4'),
    t('feature5'),
    t('feature6'),
  ]

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100" />
      <div className="absolute inset-0 bg-grid dark:opacity-30 opacity-15" />

      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <span className="section-badge mb-4">{t('badge')}</span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] max-w-3xl mx-auto">
            {t('title')}{' '}
            <span className="italic text-gradient-gold">{t('titleHighlight')}</span>
            <br />
            <span className="font-bold">{t('titlePost')}</span>
          </h2>
          <p className="mt-5 dark:text-cream-400 text-navy-700 text-lg max-w-3xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </motion.div>

        {/* Customer Photos */}
        <motion.div
          {...fadeUp(0.1)}
          className="max-w-4xl mx-auto mb-16 glass-card p-4 sm:p-6 dark:border-white/[0.06] border-navy-900/[0.06]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((src, i) => (
              <motion.div
                key={src}
                {...fadeUp(0.15 + i * 0.08)}
                className="relative aspect-[3/4] rounded-xl overflow-hidden border dark:border-white/10 border-navy-900/10"
              >
                <Image
                  src={src}
                  alt={`Amazon KDP ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div {...fadeUp(0.2)} className="max-w-3xl mx-auto mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.25 + i * 0.05)}
                className="flex items-start gap-3"
              >
                <svg
                  className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="dark:text-cream-300 text-navy-800 text-sm sm:text-base leading-relaxed">
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.4)} className="text-center">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 glow-gold">
            {t('cta')}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-3 dark:text-cream-600 text-navy-500 text-xs">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  )
}
