'use client'

import * as m from 'motion/react-m'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

const covers = [
  { src: '/lp/covers/milo.png', alt: 'Milo' },
  { src: '/lp/covers/silent-compound.png', alt: 'Silent Compound' },
  { src: '/lp/covers/flavor-lab.png', alt: 'Flavor Lab' },
  { src: '/lp/covers/rewrite-inner-code.png', alt: 'Rewrite Inner Code' },
]

export default function AiCoversSection() {
  const t = useTranslations('landingV2.aiCovers')

  return (
    <section className="relative pt-10 pb-20 md:pt-14 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 dark:bg-navy-950 bg-cream-100" />
      <div className="absolute inset-0 bg-grid dark:opacity-40 opacity-20" />

      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content — first on mobile */}
          <m.div {...fadeUp(0)} className="order-1 lg:order-2">
            <span className="section-badge mb-5">{t('badge')}</span>

            <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] mt-4 dark:text-cream-200 text-navy-900">
              {t('title')}{' '}
              <span className="italic text-gradient-gold">{t('titleHighlight')}</span>
            </h2>

            <p className="mt-6 dark:text-cream-400 text-navy-700 text-lg leading-relaxed">
              {t('description')}
            </p>

            <p className="mt-4 dark:text-cream-500 text-navy-600 text-base leading-relaxed">
              {t('description2')}
            </p>

            <Link
              href="/auth/register"
              className="btn-primary mt-8 text-base px-8 py-3.5 glow-gold"
            >
              {t('cta')}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </m.div>

          {/* Covers grid — second on mobile */}
          <m.div
            {...fadeUp(0.15)}
            className="order-2 lg:order-1 grid grid-cols-2 gap-4 sm:gap-5"
          >
            {covers.map((cover, i) => (
              <m.div
                key={cover.src}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative aspect-[3/4.5] rounded-xl overflow-hidden border dark:border-white/[0.08] border-navy-900/[0.08] shadow-xl group"
              >
                <Image
                  src={cover.src}
                  alt={cover.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 45vw, (max-width: 1024px) 30vw, 20vw"
                />
              </m.div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  )
}
