'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import clsx from 'clsx'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as number[] },
})

// ─── Comparison table data ────────────────────────────────────────────────────

const rows = [
  {
    label: 'Custo',
    ghostwriter: '$5.000 – $20.000',
    editora: '$3.000 – $15.000',
    bsa: 'A partir de $19',
    bsaHighlight: true,
  },
  {
    label: 'Tempo',
    ghostwriter: '3 – 12 meses',
    editora: '1 – 3 anos',
    bsa: 'Menos de 1 hora',
    bsaHighlight: true,
  },
  {
    label: 'Publicação na Amazon',
    ghostwriter: 'Você mesmo',
    editora: 'Seletivo / restrito',
    bsa: 'Incluso no serviço',
    bsaHighlight: true,
  },
  {
    label: 'Direitos autorais',
    ghostwriter: 'Compartilhados',
    editora: 'Cedidos à editora',
    bsa: '100% seus',
    bsaHighlight: true,
  },
  {
    label: 'Idiomas',
    ghostwriter: '1 idioma',
    editora: '1 – 2 idiomas',
    bsa: '30+ idiomas',
    bsaHighlight: true,
  },
  {
    label: 'Livro físico',
    ghostwriter: 'Separado / caro',
    editora: 'Tiragem mínima alta',
    bsa: 'Amazon imprime e entrega',
    bsaHighlight: true,
  },
]

// ─── Physical book steps ──────────────────────────────────────────────────────

const bookSteps = [
  { icon: '✍️', label: 'Você cria o livro' },
  { icon: '🌍', label: 'Publica na Amazon' },
  { icon: '🖨️', label: 'Amazon imprime' },
  { icon: '📦', label: 'Chega na sua casa' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ValueAnchorSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="section-container relative z-10">

        {/* Headline */}
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <span className="section-badge mb-4">Ancoragem de Valor</span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] max-w-3xl mx-auto">
            O serviço que custava{' '}
            <span className="text-cream-400 line-through text-2xl sm:text-3xl md:text-4xl">$20.000</span>
            <br />
            <span className="italic text-gradient-gold">agora custa $19</span>
          </h2>
          <p className="mt-5 text-cream-400 text-lg max-w-xl mx-auto leading-relaxed">
            Ghostwriters cobram uma fortuna para fazer o que nossa IA faz em minutos. Você fica com todo o crédito — e todo o lucro.
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div {...fadeUp(0.1)} className="max-w-4xl mx-auto mb-16 overflow-x-auto">
          <table className="w-full min-w-[580px]">
            {/* Header */}
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-cream-500 text-sm font-medium w-[200px]" />
                <th className="py-3 px-4 text-center">
                  <div className="text-cream-400 text-sm font-semibold">Ghostwriter</div>
                  <div className="text-cream-600 text-xs">Tradicional</div>
                </th>
                <th className="py-3 px-4 text-center">
                  <div className="text-cream-400 text-sm font-semibold">Editora</div>
                  <div className="text-cream-600 text-xs">Tradicional</div>
                </th>
                <th className="py-3 px-4 text-center">
                  <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-3 py-2">
                    <div className="text-gold-400 text-sm font-bold">Best Sellers AI</div>
                    <div className="text-gold-500/70 text-xs">Você escolheu</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={clsx(
                    'border-t border-white/[0.05]',
                    i % 2 === 0 ? 'bg-white/[0.015]' : '',
                  )}
                >
                  <td className="py-3 px-4 text-cream-400 text-sm font-medium">{row.label}</td>
                  <td className="py-3 px-4 text-center text-cream-500 text-sm">{row.ghostwriter}</td>
                  <td className="py-3 px-4 text-center text-cream-500 text-sm">{row.editora}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={clsx(
                      'text-sm font-semibold',
                      row.bsaHighlight ? 'text-gold-400' : 'text-cream-300',
                    )}>
                      {row.bsa}
                    </span>
                    {row.bsaHighlight && (
                      <svg className="w-3.5 h-3.5 text-emerald-400 inline-block ml-1.5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Physical book callout */}
        <motion.div
          {...fadeUp(0.2)}
          className="max-w-3xl mx-auto glass-card p-6 sm:p-8 border border-gold-500/15 bg-gold-500/[0.03]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-2">Livro Físico</p>
              <h3 className="font-playfair font-bold text-2xl sm:text-3xl text-cream-100 leading-tight mb-2">
                Seu livro. Com a sua capa.<br />
                <span className="text-gradient-gold italic">Na sua casa.</span>
              </h3>
              <p className="text-cream-400 text-sm leading-relaxed">
                Após a publicação na Amazon, você pode solicitar cópias físicas do seu próprio livro. A Amazon imprime e entrega direto no seu endereço — sem estoque mínimo, sem custo extra.
              </p>
            </div>

            {/* Steps */}
            <div className="flex sm:flex-col gap-3 sm:gap-2">
              {bookSteps.map((step, i) => (
                <div key={step.label} className="flex sm:flex-row items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-cream-400 text-xs hidden sm:block">{step.label}</span>
                  {i < bookSteps.length - 1 && (
                    <div className="hidden sm:block w-px h-3 bg-white/10 ml-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.3)} className="text-center mt-12">
          <Link href="#planos" className="btn-primary text-base px-8 py-3.5 glow-gold">
            Começar por $19
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-3 text-cream-600 text-xs">Sem assinatura obrigatória · Sem cartão de crédito</p>
        </motion.div>

      </div>
    </section>
  )
}
