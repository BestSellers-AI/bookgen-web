'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PlanCard from '@/components/pricing/PlanCard'
import CreditCard from '@/components/pricing/CreditCard'
import PlanCalculator from '@/components/pricing/PlanCalculator'
import { PLANS, CREDIT_PACKS, SERVICES } from '@/lib/pricing-data'
import clsx from 'clsx'

type PricingTab = 'plans' | 'credits'
type BillingPeriod = 'annual' | 'monthly'

// Custo por livro = preço anual / (créditos/mês ÷ 100cr por livro)
const comparisonRows = [
  { label: 'Obra Aspirante (avulso)', price: '$19', savings: 'referência', highlight: false },
  { label: 'Autor Aspirante ($19/mês)', price: '$6,3', savings: '67% mais barato', highlight: false },
  { label: 'Autor BestSeller ($39/mês)', price: '$5,2', savings: '73% mais barato', highlight: true },
  { label: 'Autor Elite ($89/mês)', price: '$4,5', savings: '76% mais barato', highlight: false },
]

// Badge de economia por crédito em relação ao plano anterior
const savingsBadges: Record<string, string> = {
  bestseller: '22% mais barato por livro vs Aspirante',
  editora: '13% mais barato por livro vs BestSeller',
}

export default function PricingSection() {
  const [activeTab, setActiveTab] = useState<PricingTab>('plans')
  const [billing, setBilling] = useState<BillingPeriod>('annual')
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null)

  return (
    <section id="planos" className="py-24 md:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      <div className="section-container relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <span className="section-badge mb-5">Precificação</span>
          <h2 className="font-playfair font-bold text-4xl md:text-5xl text-cream-200 mt-4 leading-tight">
            O plano certo para o{' '}
            <span className="italic text-gradient-gold">seu próximo bestseller</span>
          </h2>
          <p className="text-cream-400 mt-4 text-lg max-w-2xl mx-auto">
            Planos flexíveis para escritores, criadores e agências.
            Créditos que você usa do seu jeito.
          </p>
        </motion.div>

        {/* Tab Toggle: Planos | Créditos */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-navy-800/80 backdrop-blur-sm rounded-2xl p-1.5 border border-white/[0.08]">
            {(['plans', 'credits'] as PricingTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-7 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  activeTab === tab
                    ? 'bg-gold-500 text-navy-900 shadow-gold-sm'
                    : 'text-cream-400 hover:text-cream-200',
                )}
              >
                {tab === 'plans' ? 'Planos' : 'Créditos'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'plans' ? (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Billing Toggle */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <span className={clsx(
                  'text-sm transition-colors',
                  billing === 'monthly' ? 'text-cream-200 font-medium' : 'text-cream-500',
                )}>
                  Mensal
                </span>

                <button
                  onClick={() => setBilling(b => b === 'annual' ? 'monthly' : 'annual')}
                  className="relative w-14 h-7 bg-navy-700 rounded-full border border-white/10 transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  aria-label="Toggle billing period"
                >
                  <motion.div
                    animate={{ x: billing === 'annual' ? 28 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-6 h-6 bg-gold-500 rounded-full shadow-gold-sm"
                  />
                </button>

                <span className={clsx(
                  'text-sm transition-colors flex items-center gap-2',
                  billing === 'annual' ? 'text-cream-200 font-medium' : 'text-cream-500',
                )}>
                  Anual
                  <span className="bg-gold-500/15 border border-gold-500/25 text-gold-400 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                    2 MESES GRÁTIS
                  </span>
                </span>
              </div>

              {/* Plan Calculator */}
              <PlanCalculator onRecommend={setHighlightedPlan} />

              {/* Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {PLANS.map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    id={`plan-${plan.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <PlanCard
                      plan={plan}
                      billing={billing}
                      isHighlighted={highlightedPlan === plan.id}
                      savingsBadge={savingsBadges[plan.id]}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Enterprise CTA */}
              <div className="mt-5 glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-cream-300 font-medium">Agência ou ghostwriter com volume maior?</p>
                  <p className="text-cream-500 text-sm mt-0.5">Temos planos customizados para você.</p>
                </div>
                <button className="btn-secondary text-sm py-2.5 flex-shrink-0">
                  Fale com a gente
                </button>
              </div>

              {/* Why subscribe section */}
              <div className="mt-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-8"
                >
                  <h3 className="font-playfair font-bold text-2xl md:text-3xl text-cream-200">
                    Por que assinar em vez de comprar avulso?
                  </h3>
                  <p className="text-cream-500 text-sm mt-2">Custo por livro em cada cenário</p>
                </motion.div>

                <div className="glass-card overflow-hidden max-w-2xl mx-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left py-3 px-5 text-cream-500 font-medium text-xs uppercase tracking-wider">Plano</th>
                        <th className="text-right py-3 px-5 text-cream-500 font-medium text-xs uppercase tracking-wider">Por livro</th>
                        <th className="text-right py-3 px-5 text-cream-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Economia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr
                          key={row.label}
                          className={clsx(
                            'border-b border-white/[0.04] last:border-0',
                            row.highlight ? 'bg-gold-500/[0.06]' : 'hover:bg-white/[0.02]',
                          )}
                        >
                          <td className={clsx(
                            'py-3.5 px-5',
                            row.highlight ? 'text-gold-400 font-semibold' : 'text-cream-300',
                          )}>
                            {row.label}
                            {row.highlight && (
                              <span className="ml-2 text-[10px] bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded font-bold">
                                ⭐
                              </span>
                            )}
                          </td>
                          <td className={clsx(
                            'py-3.5 px-5 text-right font-mono font-bold',
                            row.highlight ? 'text-gold-400 text-base' : 'text-cream-200',
                          )}>
                            {row.price}
                          </td>
                          <td className={clsx(
                            'py-3.5 px-5 text-right text-xs hidden sm:table-cell',
                            row.highlight ? 'text-gold-400 font-semibold' : 'text-cream-500',
                          )}>
                            {row.savings}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

          ) : (

            <motion.div
              key="credits"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Credits header */}
              <div className="text-center mb-6">
                <p className="text-cream-400 text-sm">
                  Créditos sem prazo de validade · Sem recorrência · Use quando quiser
                </p>
              </div>

              {/* Comparison banner */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2.5 bg-gold-500/[0.08] border border-gold-500/20 rounded-xl px-5 py-3 text-sm">
                  <span className="text-gold-400 text-base">💡</span>
                  <span className="text-cream-300">
                    No plano Autor BestSeller, 1 livro custa $5,2 —{' '}
                    <strong className="text-gold-400">mais de 3× mais barato</strong>
                  </span>
                </div>
              </div>

              {/* Credit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack, i) => (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <CreditCard pack={pack} />
                  </motion.div>
                ))}
              </div>

              {/* Services Table */}
              <div className="mt-20">
                <div className="text-center mb-8">
                  <h3 className="font-playfair font-bold text-2xl md:text-3xl text-cream-200">
                    Tabela de créditos por serviço
                  </h3>
                  <p className="text-cream-500 text-sm mt-2">Saiba exatamente quantos créditos cada serviço custa</p>
                </div>

                <div className="glass-card overflow-hidden max-w-lg mx-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left py-3 px-6 text-cream-500 font-medium text-xs uppercase tracking-wider">Serviço</th>
                        <th className="text-right py-3 px-6 text-cream-500 font-medium text-xs uppercase tracking-wider">Créditos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SERVICES.map((service) => (
                        <tr
                          key={service.name}
                          className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3.5 px-6 text-cream-300">{service.name}</td>
                          <td className="py-3.5 px-6 text-right font-mono text-gold-400 font-bold">{service.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
