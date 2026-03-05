'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Descreva sua ideia',
    description: 'Informe o tema, gênero, público-alvo e idioma. Nossa IA entende o contexto e estrutura seu projeto em segundos.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    time: '2 min',
  },
  {
    number: '02',
    title: 'A IA escreve seu livro',
    description: 'Modelos de linguagem avançados geram um livro completo de 30K+ palavras, estruturado, coerente e revisado.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    time: '45 min',
  },
  {
    number: '03',
    title: 'Capa, imagens e tradução',
    description: 'Escolha entre 6 variações de capa geradas por IA. Adicione imagens internas e traduza para 30+ idiomas.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    time: '10 min',
  },
  {
    number: '04',
    title: 'Baixe ou publique',
    description: 'Baixe seu livro em DOCX + PDF instantaneamente. Se quiser ir além, nossa equipe cuida da publicação completa na Amazon — ISBN, formatação e tudo mais.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    time: 'Download imediato',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950/60 to-navy-900 pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="section-container relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="section-badge mb-5">Como Funciona</span>
          <h2 className="font-playfair font-bold text-4xl md:text-5xl text-cream-200 mt-4">
            De ideia a{' '}
            <span className="italic text-gradient-gold">bestseller</span>
            <br />em 4 passos
          </h2>
          <p className="text-cream-400 mt-4 text-lg max-w-xl mx-auto">
            Sem curva de aprendizado. Sem conhecimento técnico. Só você e sua história.
          </p>
        </motion.div>

        {/* Timeline — Desktop */}
        <div className="hidden lg:block relative">

          {/* Animated connecting line */}
          <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-white/[0.06]">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-gold-500/60 via-gold-400/40 to-gold-500/60"
            />
          </div>

          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step circle */}
                <div className="relative z-10 w-[104px] h-[104px] mb-6 flex items-center justify-center">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border border-gold-500/20 bg-navy-950" />
                  {/* Inner circle */}
                  <div className="relative w-20 h-20 rounded-full bg-navy-800 border border-gold-500/30 flex flex-col items-center justify-center gap-0.5 shadow-gold-sm">
                    <span className="font-playfair font-bold text-gold-400 text-2xl leading-none">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Card */}
                <div className="w-full bg-navy-800/80 border border-white/[0.09] hover:border-gold-500/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto mb-3">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-cream-100 text-base mb-2">{step.title}</h3>
                  <p className="text-cream-500 text-sm leading-relaxed mb-3">{step.description}</p>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {step.time}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stepper — Mobile / Tablet */}
        <div className="lg:hidden flex flex-col gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-5 relative"
            >
              {/* Left column: number + connector */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-navy-800 border border-gold-500/30 flex items-center justify-center flex-shrink-0 z-10 shadow-gold-sm">
                  <span className="font-playfair font-bold text-gold-400 text-lg leading-none">{step.number}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2 mb-2 bg-gradient-to-b from-gold-500/30 to-transparent min-h-[24px]" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 mb-6 bg-navy-800/80 border border-white/[0.09] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 flex-shrink-0">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-cream-100 text-base">{step.title}</h3>
                </div>
                <p className="text-cream-500 text-sm leading-relaxed mb-3">{step.description}</p>
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {step.time}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total time callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-center"
        >
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div className="text-left">
              <p className="text-gold-400 font-bold text-lg leading-none">Menos de 1 hora</p>
              <p className="text-cream-500 text-xs mt-0.5">do zero ao livro publicável</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">✍️</span>
            <div className="text-left">
              <p className="text-cream-200 font-bold text-lg leading-none">Sem escrever</p>
              <p className="text-cream-500 text-xs mt-0.5">uma única palavra</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div className="text-left">
              <p className="text-cream-200 font-bold text-lg leading-none">30.000+ palavras</p>
              <p className="text-cream-500 text-xs mt-0.5">livro completo e estruturado</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <a href="#planos" className="btn-primary mx-auto">
            Ver planos e começar agora
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
