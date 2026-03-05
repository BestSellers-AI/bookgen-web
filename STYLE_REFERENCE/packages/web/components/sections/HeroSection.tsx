'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const stats = [
  { value: '100.000+', label: 'livros criados' },
  { value: '180+', label: 'países atendidos' },
  { value: '4.9★', label: 'avaliação média' },
  { value: '30+', label: 'idiomas disponíveis' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as number[] },
})

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">

      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900" />
      <div className="absolute inset-0 bg-hero-radial" />
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="section-container relative z-10 flex flex-col items-center text-center pt-6 pb-16 md:pt-10 md:pb-24">

        {/* Badge */}
        <motion.div {...fadeUp(0.1)}>
          <span className="section-badge mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            IA Editorial de Última Geração
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.2)}
          className="font-playfair font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight max-w-4xl"
        >
          Seu próximo{' '}
          <span className="italic text-gradient-gold">bestseller</span>
          <br />
          <span className="text-cream-200">começa aqui.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.3)}
          className="mt-6 text-lg md:text-xl text-cream-400 max-w-2xl leading-relaxed"
        >
          Crie, personalize e publique livros profissionais com IA em minutos.
          <br className="hidden sm:block" />
          Capa, tradução e publicação na Amazon. Sem experiência prévia.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(0.4)}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="#planos" className="btn-primary text-base px-8 py-3.5 glow-gold">
            Criar meu projeto grátis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link href="#como-funciona" className="btn-secondary text-base px-7 py-3.5">
            Ver como funciona
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </motion.div>

        {/* Trust line */}
        <motion.p {...fadeUp(0.5)} className="mt-5 text-xs text-cream-500">
          Menos de 1 hora · Sem escrever uma palavra · 100% seus direitos autorais
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 w-full max-w-3xl"
        >
          <div className="glass-card px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/[0.07]">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center text-center gap-0.5">
                <span className="font-playfair font-bold text-2xl md:text-3xl text-gold-400">
                  {stat.value}
                </span>
                <span className="text-xs text-cream-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Scroll indicator — absolute bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-10 bg-gradient-to-b from-gold-500/30 to-transparent" />
      </motion.div>
    </section>
  )
}
