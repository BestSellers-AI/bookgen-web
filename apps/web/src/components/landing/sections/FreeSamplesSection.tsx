'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function FreeSamplesSection() {
  const t = useTranslations('landingV2.freeSamples')

  const books = [
    { title: t('book1Title'), genre: t('book1Genre'), cover: '/lp/samples/the-first-liar.png', pdf: '/lp/samples/the-first-liar.pdf' },
    { title: t('book2Title'), genre: t('book2Genre'), cover: '/lp/samples/borrowed-recall.png', pdf: '/lp/samples/borrowed-recall.pdf' },
    { title: t('book3Title'), genre: t('book3Genre'), cover: '/lp/samples/stillness-within.png', pdf: '/lp/samples/stillness-within.pdf' },
    { title: t('book4Title'), genre: t('book4Genre'), cover: '/lp/samples/letters-from-tomorrow.png', pdf: '/lp/samples/letters-from-tomorrow.pdf' },
    { title: t('book5Title'), genre: t('book5Genre'), cover: '/lp/samples/the-predestined-diary.png', pdf: '/lp/samples/the-predestined-diary.pdf' },
    { title: t('book6Title'), genre: t('book6Genre'), cover: '/lp/samples/awakened-echoes.png', pdf: '/lp/samples/awakened-echoes.pdf' },
  ]

  return (
    <section id="amostras" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-navy-900 dark:via-navy-950/60 dark:to-navy-900 bg-gradient-to-b from-cream-50 via-cream-100/60 to-cream-50 pointer-events-none" />
      <div className="absolute inset-0 bg-grid dark:opacity-30 opacity-15" />

      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="section-badge mb-5">{t('badge')}</span>
          <h2 className="font-playfair font-bold text-4xl md:text-5xl dark:text-cream-200 text-navy-900 mt-4">
            {t('title')}{' '}
            <span className="italic text-gradient-gold">{t('titleHighlight')}</span>
          </h2>
          <p className="dark:text-cream-400 text-navy-700 mt-4 text-lg max-w-xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book, i) => (
            <motion.div
              key={book.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-6 flex flex-col items-center gap-4"
            >
              <div className="relative aspect-[3/4.5] w-full max-w-[200px] rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 200px"
                />
              </div>

              <h3 className="font-semibold dark:text-cream-100 text-navy-900 text-base text-center">
                {book.title}
              </h3>

              <p className="dark:text-cream-500 text-navy-600 text-sm text-center">
                {book.genre}
              </p>

              <a
                href={book.pdf}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border dark:border-gold-500/40 border-gold-600/40 dark:text-gold-400 text-gold-600 text-sm font-semibold transition-all duration-300 dark:hover:bg-gold-500/10 hover:bg-gold-600/10 dark:hover:border-gold-500/60 hover:border-gold-600/60"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('downloadPdf')}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
