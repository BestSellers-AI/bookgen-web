'use client'

import * as m from 'motion/react-m'
import { useTranslations } from 'next-intl'

const stepIcons = [
  <svg key="1" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  <svg key="2" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  <svg key="3" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  <svg key="4" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
]

export default function HowItWorksSection() {
  const t = useTranslations('landingV2.howItWorks')

  const steps = [
    { number: '01', title: t('step1Title'), description: t('step1Desc'), icon: stepIcons[0], time: t('step1Time') },
    { number: '02', title: t('step2Title'), description: t('step2Desc'), icon: stepIcons[1], time: t('step2Time') },
    { number: '03', title: t('step3Title'), description: t('step3Desc'), icon: stepIcons[2], time: t('step3Time') },
    { number: '04', title: t('step4Title'), description: t('step4Desc'), icon: stepIcons[3], time: t('step4Time') },
  ]

  return (
    <section id="como-funciona" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-900 dark:via-navy-950/60 dark:to-navy-900 bg-gradient-to-b from-cream-50 via-cream-100/60 to-cream-50 pointer-events-none" />
      <div className="absolute inset-0 bg-grid dark:opacity-30 opacity-15" />

      <div className="section-container relative">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="section-badge mb-5">{t('badge')}</span>
          <h2 className="font-playfair font-bold text-4xl md:text-5xl dark:text-cream-200 text-navy-900 mt-4">
            {t('headline1')}{' '}
            <span className="italic text-gradient-gold">{t('headlineHighlight')}</span>
            <br />{t('headline2')}
          </h2>
          <p className="dark:text-cream-400 text-navy-700 mt-4 text-lg max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </m.div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block relative">
          <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px dark:bg-white/[0.06] bg-navy-900/[0.06]">
            <m.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0 }}
              className="absolute inset-0 dark:bg-gradient-to-r dark:from-gold-500/60 dark:via-gold-400/40 dark:to-gold-500/60 bg-gradient-to-r from-gold-600/60 via-gold-500/40 to-gold-600/60"
            />
          </div>

          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <m.div
                key={step.number}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 w-[104px] h-[104px] mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full dark:border-gold-500/20 border-gold-600/20 border dark:bg-navy-950 bg-cream-50" />
                  <div className="relative w-20 h-20 rounded-full dark:bg-navy-800 bg-cream-200 border dark:border-gold-500/30 border-gold-600/30 flex flex-col items-center justify-center gap-0.5 shadow-gold-sm">
                    <span className="font-playfair font-bold dark:text-gold-400 text-gold-600 text-2xl leading-none">
                      {step.number}
                    </span>
                  </div>
                </div>

                <div className="w-full dark:bg-navy-800/80 bg-cream-100/80 border dark:border-white/[0.09] border-navy-900/[0.09] dark:hover:border-gold-500/20 hover:border-gold-600/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover">
                  <div className="w-10 h-10 rounded-xl dark:bg-gold-500/10 bg-gold-600/10 border dark:border-gold-500/20 border-gold-600/20 flex items-center justify-center dark:text-gold-400 text-gold-600 mx-auto mb-3">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold dark:text-cream-100 text-navy-900 text-base mb-2">{step.title}</h3>
                  <p className="dark:text-cream-500 text-navy-600 text-sm leading-relaxed mb-3">{step.description}</p>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {step.time}
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>

        {/* Mobile Stepper */}
        <div className="lg:hidden flex flex-col gap-0">
          {steps.map((step, i) => (
            <m.div
              key={step.number}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-5 relative"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full dark:bg-navy-800 bg-cream-200 border dark:border-gold-500/30 border-gold-600/30 flex items-center justify-center flex-shrink-0 z-10 shadow-gold-sm">
                  <span className="font-playfair font-bold dark:text-gold-400 text-gold-600 text-lg leading-none">{step.number}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2 mb-2 dark:bg-gradient-to-b dark:from-gold-500/30 bg-gradient-to-b from-gold-600/30 to-transparent min-h-[24px]" />
                )}
              </div>

              <div className="flex-1 mb-6 dark:bg-navy-800/80 bg-cream-100/80 border dark:border-white/[0.09] border-navy-900/[0.09] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl dark:bg-gold-500/10 bg-gold-600/10 border dark:border-gold-500/20 border-gold-600/20 flex items-center justify-center dark:text-gold-400 text-gold-600 flex-shrink-0">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold dark:text-cream-100 text-navy-900 text-base">{step.title}</h3>
                </div>
                <p className="dark:text-cream-500 text-navy-600 text-sm leading-relaxed mb-3">{step.description}</p>
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {step.time}
                </div>
              </div>
            </m.div>
          ))}
        </div>

        {/* Callouts */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-center"
        >
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div className="text-left">
              <p className="dark:text-gold-400 text-gold-600 font-bold text-lg leading-none">{t('callout1Value')}</p>
              <p className="dark:text-cream-500 text-navy-600 text-xs mt-0.5">{t('callout1Label')}</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 dark:bg-white/10 bg-navy-900/10" />
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">✍️</span>
            <div className="text-left">
              <p className="dark:text-cream-200 text-navy-900 font-bold text-lg leading-none">{t('callout2Value')}</p>
              <p className="dark:text-cream-500 text-navy-600 text-xs mt-0.5">{t('callout2Label')}</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 dark:bg-white/10 bg-navy-900/10" />
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div className="text-left">
              <p className="dark:text-cream-200 text-navy-900 font-bold text-lg leading-none">{t('callout3Value')}</p>
              <p className="dark:text-cream-500 text-navy-600 text-xs mt-0.5">{t('callout3Label')}</p>
            </div>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <a href="#planos" className="btn-primary mx-auto">
            {t('cta')}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </m.div>
      </div>
    </section>
  )
}
