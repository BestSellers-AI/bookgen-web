import Link from 'next/link'
import Footer from './Footer'

interface Section {
  title: string
  content: string | string[]
}

interface LegalLayoutProps {
  title: string
  subtitle: string
  lastUpdated: string
  sections: Section[]
}

export default function LegalLayout({ title, subtitle, lastUpdated, sections }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-navy-900">
      {/* Topbar */}
      <header className="border-b border-white/[0.06] bg-navy-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="section-container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#legal-logo-bg)" />
              <path d="M8 10C8 10 10 10.5 11.5 11C13 11.5 14 12 14 12V22C14 22 12.8 21.5 11.5 21C10 20.4 8 20 8 20V10Z" fill="#F59E0B" opacity="0.9" />
              <path d="M24 10C24 10 22 10.5 20.5 11C19 11.5 18 12 18 12V22C18 22 19.2 21.5 20.5 21C22 20.4 24 20 24 20V10Z" fill="#FCD34D" opacity="0.75" />
              <rect x="14.5" y="9" width="3" height="14" rx="0.5" fill="#F59E0B" />
              <path d="M16 4L16.8 6.5L19.5 6L17.5 7.8L18.5 10.5L16 9L13.5 10.5L14.5 7.8L12.5 6L15.2 6.5L16 4Z" fill="#FCD34D" />
              <defs>
                <linearGradient id="legal-logo-bg" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#131627" />
                  <stop offset="100%" stopColor="#0D0F1C" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-playfair font-bold text-cream-300 text-sm group-hover:text-cream-100 transition-colors">
              Best Sellers AI
            </span>
          </Link>
          <Link
            href="/"
            className="text-cream-400 hover:text-cream-200 text-sm flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao início
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="section-container py-14 md:py-20 max-w-3xl">
        {/* Header */}
        <div className="mb-10 pb-8 border-b border-white/[0.06]">
          <h1 className="font-playfair font-bold text-3xl md:text-4xl text-cream-100 mb-2">
            {title}
          </h1>
          <p className="text-cream-400 text-base mb-4">{subtitle}</p>
          <p className="text-cream-600 text-xs">Última atualização: {lastUpdated}</p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-9">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="font-semibold text-cream-200 text-lg mb-3">
                {i + 1}. {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className="flex flex-col gap-2">
                  {section.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-cream-400 text-sm leading-relaxed">
                      <span className="text-gold-500/60 mt-1 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-cream-400 text-sm leading-relaxed">{section.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <p className="text-cream-500 text-sm">
            Dúvidas sobre este documento?{' '}
            <a
              href="mailto:contato@bestsellers-ai.com"
              className="text-gold-400 hover:text-gold-300 transition-colors"
            >
              contato@bestsellers-ai.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
