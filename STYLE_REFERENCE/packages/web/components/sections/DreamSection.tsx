'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

// ─── Book mockups data ────────────────────────────────────────────────────────

const books = [
  { title: 'O Método dos\nCampeões', genre: 'Self-Help', from: '#1a1060', to: '#6d28d9' },
  { title: 'Finanças para\nMamães', genre: 'Finanças', from: '#064e3b', to: '#059669' },
  { title: 'Dieta dos\n30 Dias', genre: 'Saúde', from: '#7c2d12', to: '#ea580c' },
  { title: 'Criança Feliz,\nFamília Plena', genre: 'Parentalidade', from: '#1e3a5f', to: '#2563eb' },
  { title: 'Receitas da\nVovó Digital', genre: 'Gastronomia', from: '#4a1942', to: '#a21caf' },
  { title: 'O Empreendedor\nSem Desculpas', genre: 'Negócios', from: '#1c1917', to: '#ca8a04' },
  { title: 'Meditação\nPara Todos', genre: 'Bem-Estar', from: '#0f3460', to: '#0ea5e9' },
  { title: 'Segredos do\nMercado Imobiliário', genre: 'Investimentos', from: '#14532d', to: '#16a34a' },
]

// duplicate for seamless loop
const allBooks = [...books, ...books]

// ─── Journey steps ────────────────────────────────────────────────────────────

const steps = [
  { icon: '💡', label: 'Sua ideia' },
  { icon: '✍️', label: 'Pronto em 1h' },
  { icon: '🌍', label: 'Na Amazon' },
  { icon: '📦', label: 'Na sua casa' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as number[] },
})

// ─── BookCard ────────────────────────────────────────────────────────────────

function BookCard({ book }: { book: typeof books[0] }) {
  return (
    <div className="flex-shrink-0 w-[120px] mx-3 select-none">
      {/* Cover */}
      <div
        className="w-[120px] h-[170px] rounded-r-lg rounded-l-sm relative overflow-hidden shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${book.from}, ${book.to})` }}
      >
        {/* Spine shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/30" />
        {/* Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
        {/* Title */}
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <p className="text-white/90 text-[10px] font-bold leading-tight whitespace-pre-line">
            {book.title}
          </p>
          <p className="text-white/50 text-[8px] uppercase tracking-wider font-semibold">
            {book.genre}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DreamSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
      <div className="absolute inset-0 bg-grid opacity-40" />

      <div className="section-container relative z-10">

        {/* Headline */}
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] max-w-3xl mx-auto">
            A ideia que está na sua cabeça{' '}
            <span className="italic text-gradient-gold">há anos</span>
            <br />
            <span className="text-cream-200">finalmente vai existir.</span>
          </h2>
          <p className="mt-5 text-cream-400 text-lg max-w-xl mx-auto leading-relaxed">
            Não faltou talento. Não faltou conteúdo. Faltou uma ferramenta que fizesse o trabalho pesado por você.
          </p>
        </motion.div>

        {/* Two types of people */}
        <motion.div
          {...fadeUp(0.1)}
          className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-14"
        >
          {/* Type A */}
          <div className="glass-card p-6 border border-white/[0.06]">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">😔</span>
              <div>
                <p className="text-cream-300 text-sm font-semibold mb-1">Quem adia</p>
                <p className="text-cream-500 text-sm leading-relaxed">
                  "Algum dia vou escrever esse livro." Anos passam, a ideia continua na cabeça, nunca sai do papel.
                </p>
              </div>
            </div>
          </div>
          {/* Type B */}
          <div className="glass-card p-6 border border-gold-500/20 bg-gold-500/[0.03]">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🚀</span>
              <div>
                <p className="text-gold-400 text-sm font-semibold mb-1">Quem age</p>
                <p className="text-cream-400 text-sm leading-relaxed">
                  Entra na plataforma, descreve a ideia, e em menos de 1 hora tem o livro pronto para publicar na Amazon.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Journey steps */}
        <motion.div {...fadeUp(0.2)} className="flex items-center justify-center gap-0 mb-16 overflow-x-auto pb-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2 px-4 sm:px-6">
                <div className="w-12 h-12 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center text-2xl shadow-lg">
                  {step.icon}
                </div>
                <span className="text-cream-400 text-xs font-medium whitespace-nowrap">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 w-8 sm:w-12 h-px bg-gradient-to-r from-white/20 to-gold-500/40 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold-500/60" />
                </div>
              )}
            </div>
          ))}
        </motion.div>

      </div>

      {/* Book marquee — full width */}
      <div className="relative w-full overflow-hidden mb-14">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-navy-950 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-navy-950 to-transparent pointer-events-none" />

        <motion.div
          className="flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {allBooks.map((book, i) => (
            <BookCard key={i} book={book} />
          ))}
        </motion.div>
      </div>

      {/* Micro CTA */}
      <motion.div {...fadeUp(0.3)} className="text-center">
        <p className="text-cream-500 text-sm mb-4">
          Mais de 100.000 livros criados em 180 países. O próximo pode ser o seu.
        </p>
        <Link
          href="#planos"
          className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 font-semibold text-sm transition-colors"
        >
          Ver planos a partir de $19
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </motion.div>

    </section>
  )
}
