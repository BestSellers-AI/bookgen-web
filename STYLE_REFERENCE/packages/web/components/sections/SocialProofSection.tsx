'use client'

import { motion } from 'framer-motion'

const stats = [
  {
    value: '100.000+',
    label: 'livros criados',
    icon: '📚',
  },
  {
    value: '180+',
    label: 'países atendidos',
    icon: '🌎',
  },
  {
    value: '4.9★',
    label: 'avaliação dos autores',
    icon: '⭐',
  },
  {
    value: '30+',
    label: 'idiomas disponíveis',
    icon: '🌐',
  },
]

const testimonials = [
  {
    quote: 'Eu nunca pensei que seria capaz de escrever um livro. Em menos de 1 hora tinha o meu pronto, com capa, estruturado do início ao fim. Parece que foi feito por um profissional.',
    name: 'Ana Paula M.',
    role: 'Coach de carreira',
    avatar: 'AP',
  },
  {
    quote: 'Sempre quis compartilhar meu método de trabalho num livro, mas nunca tive tempo de escrever. Descrevi minha ideia e a IA fez tudo. Hoje meu livro está na Amazon e já virou autoridade no meu mercado.',
    name: 'Ricardo T.',
    role: 'Consultor de negócios',
    avatar: 'RT',
  },
  {
    quote: 'O que mais me surpreendeu foi a qualidade do conteúdo. Não é texto genérico — é o meu livro, com a minha voz e o meu tema. Fiz questão de revisar e mudei muito pouco.',
    name: 'Fernanda L.',
    role: 'Terapeuta e autora',
    avatar: 'FL',
  },
]

export default function SocialProofSection() {
  return (
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/50 to-navy-900 pointer-events-none" />

      <div className="section-container relative">

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-16 text-sm text-cream-400"
        >
          {stats.map((stat, i) => (
            <span key={stat.label} className="flex items-center gap-2">
              <span>{stat.icon}</span>
              <strong className="text-cream-200 font-semibold">{stat.value}</strong>
              <span>{stat.label}</span>
              {i < stats.length - 1 && (
                <span className="hidden sm:inline text-cream-600 mx-1">·</span>
              )}
            </span>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-cream-300 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-cream-200 text-sm font-medium">{t.name}</p>
                  <p className="text-cream-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
