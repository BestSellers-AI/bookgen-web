'use client'

import * as m from 'motion/react-m'
import { useTranslations } from 'next-intl'

export default function SocialProofSection() {
  const t = useTranslations('landingV2.social')

  const stats = [
    { icon: t('stat1Icon'), value: t('stat1Value'), label: t('stat1Label') },
    { icon: t('stat2Icon'), value: t('stat2Value'), label: t('stat2Label') },
    { icon: t('stat3Icon'), value: t('stat3Value'), label: t('stat3Label') },
    { icon: t('stat4Icon'), value: t('stat4Value'), label: t('stat4Label') },
  ]

  const testimonials = [
    { quote: t('testimonial1Quote'), name: t('testimonial1Name'), role: t('testimonial1Role'), avatar: t('testimonial1Avatar') },
    { quote: t('testimonial2Quote'), name: t('testimonial2Name'), role: t('testimonial2Role'), avatar: t('testimonial2Avatar') },
    { quote: t('testimonial3Quote'), name: t('testimonial3Name'), role: t('testimonial3Role'), avatar: t('testimonial3Avatar') },
  ]

  return (
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-950/50 dark:to-navy-900 bg-gradient-to-b from-cream-100/50 to-cream-50 pointer-events-none" />

      <div className="section-container relative">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-16 text-sm dark:text-cream-400 text-navy-700"
        >
          {stats.map((stat, i) => (
            <span key={stat.label} className="flex items-center gap-2">
              <span>{stat.icon}</span>
              <strong className="dark:text-cream-200 text-navy-900 font-semibold">{stat.value}</strong>
              <span>{stat.label}</span>
              {i < stats.length - 1 && (
                <span className="hidden sm:inline dark:text-cream-600 text-navy-400 mx-1">·</span>
              )}
            </span>
          ))}
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, i) => (
            <m.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col gap-4"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="dark:text-cream-300 text-navy-800 text-sm leading-relaxed flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-2 border-t dark:border-white/[0.06] border-navy-900/[0.06]">
                <div className="w-9 h-9 rounded-full dark:bg-gold-500/20 bg-gold-600/15 border dark:border-gold-500/30 border-gold-600/30 flex items-center justify-center dark:text-gold-400 text-gold-700 text-xs font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="dark:text-cream-200 text-navy-900 text-sm font-medium">{testimonial.name}</p>
                  <p className="dark:text-cream-500 text-navy-600 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
