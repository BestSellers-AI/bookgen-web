'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function FooterCTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-navy-950" />
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Gold glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/8 blur-[100px] rounded-full pointer-events-none" />

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <span className="section-badge mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            Comece agora, sem compromisso
          </span>

          {/* Headline */}
          <h2 className="font-playfair font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight">
            <span className="text-cream-200">Seu próximo livro</span>
            <br />
            <span className="italic text-gradient-gold">está a um clique.</span>
          </h2>

          {/* Sub */}
          <p className="mt-6 text-lg text-cream-400 max-w-xl leading-relaxed">
            Crie prévias do seu livro gratuitamente e só pague quando estiver pronto para avançar.
            Só você, sua ideia e a IA mais avançada do mercado editorial.
          </p>

          {/* CTA */}
          <Link
            href="#planos"
            className="btn-primary mt-10 text-base px-10 py-4 glow-gold"
          >
            Criar meu projeto grátis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* Trust */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Prévias gratuitas
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Cancele quando quiser
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Suporte 24/7
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              30+ idiomas suportados
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
