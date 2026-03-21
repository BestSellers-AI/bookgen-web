'use client'

import * as m from 'motion/react-m'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import clsx from 'clsx'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

export default function ValueAnchorSection() {
  const t = useTranslations('landingV2.valueAnchor')

  const rows = [
    { label: t('rowCostLabel'), gw: t('rowCostGw'), ed: t('rowCostEd'), bsa: t('rowCostBsa') },
    { label: t('rowTimeLabel'), gw: t('rowTimeGw'), ed: t('rowTimeEd'), bsa: t('rowTimeBsa') },
    { label: t('rowPublishLabel'), gw: t('rowPublishGw'), ed: t('rowPublishEd'), bsa: t('rowPublishBsa') },
    { label: t('rowRightsLabel'), gw: t('rowRightsGw'), ed: t('rowRightsEd'), bsa: t('rowRightsBsa') },
    { label: t('rowLangsLabel'), gw: t('rowLangsGw'), ed: t('rowLangsEd'), bsa: t('rowLangsBsa') },
    { label: t('rowPhysicalLabel'), gw: t('rowPhysicalGw'), ed: t('rowPhysicalEd'), bsa: t('rowPhysicalBsa') },
  ]

  const bookSteps = [
    { icon: '✍️', label: t('physicalStep1') },
    { icon: '🌍', label: t('physicalStep2') },
    { icon: '🖨️', label: t('physicalStep3') },
    { icon: '📦', label: t('physicalStep4') },
  ]

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100" />
      <div className="absolute inset-0 bg-grid dark:opacity-30 opacity-15" />

      <div className="section-container relative z-10">
        <m.div {...fadeUp(0)} className="text-center mb-14">
          <span className="section-badge mb-4">{t('badge')}</span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] max-w-3xl mx-auto">
            {t('headline1')}{' '}
            <span className="dark:text-cream-400 text-navy-500 line-through text-2xl sm:text-3xl md:text-4xl">{t('headlineStrike')}</span>
            <br />
            <span className="italic text-gradient-gold">{t('headlineHighlight')}</span>
          </h2>
          <p className="mt-5 dark:text-cream-400 text-navy-700 text-lg max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </m.div>

        <m.div {...fadeUp(0.1)} className="max-w-4xl mx-auto mb-16 overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 dark:text-cream-500 text-navy-600 text-sm font-medium w-[200px]" />
                <th className="py-3 px-4 text-center">
                  <div className="dark:text-cream-400 text-navy-700 text-sm font-semibold">{t('colGhostwriter')}</div>
                  <div className="dark:text-cream-600 text-navy-500 text-xs">{t('colGhostwriterSub')}</div>
                </th>
                <th className="py-3 px-4 text-center">
                  <div className="dark:text-cream-400 text-navy-700 text-sm font-semibold">{t('colEditora')}</div>
                  <div className="dark:text-cream-600 text-navy-500 text-xs">{t('colEditoraSub')}</div>
                </th>
                <th className="py-3 px-4 text-center">
                  <div className="dark:bg-gold-500/10 bg-gold-600/10 border dark:border-gold-500/20 border-gold-600/20 rounded-xl px-3 py-2">
                    <div className="dark:text-gold-400 text-gold-700 text-sm font-bold">{t('colBsa')}</div>
                    <div className="dark:text-gold-500/70 text-gold-600/70 text-xs">{t('colBsaSub')}</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={clsx(
                    'border-t dark:border-white/[0.05] border-navy-900/[0.05]',
                    i % 2 === 0 ? 'dark:bg-white/[0.015] bg-navy-900/[0.015]' : '',
                  )}
                >
                  <td className="py-3 px-4 dark:text-cream-400 text-navy-700 text-sm font-medium">{row.label}</td>
                  <td className="py-3 px-4 text-center dark:text-cream-500 text-navy-600 text-sm">{row.gw}</td>
                  <td className="py-3 px-4 text-center dark:text-cream-500 text-navy-600 text-sm">{row.ed}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-semibold dark:text-gold-400 text-gold-700">
                      {row.bsa}
                    </span>
                    <svg className="w-3.5 h-3.5 text-emerald-400 inline-block ml-1.5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </m.div>

        <m.div
          {...fadeUp(0.2)}
          className="max-w-3xl mx-auto glass-card p-6 sm:p-8 dark:border-gold-500/15 border-gold-600/15 dark:bg-gold-500/[0.03] bg-gold-600/[0.03]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <p className="dark:text-gold-400 text-gold-700 text-xs font-bold uppercase tracking-widest mb-2">{t('physicalBadge')}</p>
              <h3 className="font-playfair font-bold text-2xl sm:text-3xl dark:text-cream-100 text-navy-900 leading-tight mb-2">
                {t('physicalTitle1')}<br />
                <span className="text-gradient-gold italic">{t('physicalTitle2')}</span>
              </h3>
              <p className="dark:text-cream-400 text-navy-700 text-sm leading-relaxed">
                {t('physicalDesc')}
              </p>
            </div>

            <div className="flex sm:flex-col gap-3 sm:gap-2">
              {bookSteps.map((step, i) => (
                <div key={step.label} className="flex sm:flex-row items-center gap-2">
                  <div className="w-9 h-9 rounded-full dark:bg-navy-800 bg-cream-200 border dark:border-white/10 border-navy-900/10 flex items-center justify-center text-lg flex-shrink-0">
                    {step.icon}
                  </div>
                  <span className="dark:text-cream-400 text-navy-700 text-xs hidden sm:block">{step.label}</span>
                  {i < bookSteps.length - 1 && (
                    <div className="hidden sm:block w-px h-3 dark:bg-white/10 bg-navy-900/10 ml-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </m.div>

        <m.div {...fadeUp(0.3)} className="text-center mt-12">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 glow-gold">
            {t('cta')}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-3 dark:text-cream-600 text-navy-500 text-xs">{t('ctaSub')}</p>
        </m.div>
      </div>
    </section>
  )
}
