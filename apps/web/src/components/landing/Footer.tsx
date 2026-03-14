'use client'

import { useTranslations } from 'next-intl'

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="url(#footer-logo-bg)" />
      <path d="M8 10C8 10 10 10.5 11.5 11C13 11.5 14 12 14 12V22C14 22 12.8 21.5 11.5 21C10 20.4 8 20 8 20V10Z" fill="#F59E0B" opacity="0.9" />
      <path d="M24 10C24 10 22 10.5 20.5 11C19 11.5 18 12 18 12V22C18 22 19.2 21.5 20.5 21C22 20.4 24 20 24 20V10Z" fill="#FCD34D" opacity="0.75" />
      <rect x="14.5" y="9" width="3" height="14" rx="0.5" fill="#F59E0B" />
      <path d="M16 4L16.8 6.5L19.5 6L17.5 7.8L18.5 10.5L16 9L13.5 10.5L14.5 7.8L12.5 6L15.2 6.5L16 4Z" fill="#FCD34D" />
      <defs>
        <linearGradient id="footer-logo-bg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#131627" />
          <stop offset="100%" stopColor="#0D0F1C" />
        </linearGradient>
      </defs>
    </svg>
    <span className="font-playfair font-bold dark:text-cream-300 text-navy-800 text-sm">Best Sellers AI</span>
  </div>
)

export default function Footer() {
  const t = useTranslations('landingV2.footer')

  const links: Record<string, { label: string; href: string; openChat?: boolean }[]> = {
    [t('colProduct')]: [
      { label: t('linkPlans'), href: '#planos' },
      { label: t('linkHowItWorks'), href: '#como-funciona' },
      { label: t('linkFaq'), href: '#faq' },
    ],
    [t('colLegal')]: [
      { label: t('linkTerms'), href: '#' },
      { label: t('linkPrivacy'), href: '#' },
      { label: t('linkCookies'), href: '#' },
    ],
    [t('colContact')]: [
      { label: t('linkSupport'), href: '#', openChat: true },
      { label: t('linkContactUs'), href: '#', openChat: true },
    ],
  }

  return (
    <footer className="dark:bg-navy-950 bg-cream-50 border-t dark:border-white/[0.06] border-navy-900/[0.06]">
      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 dark:text-cream-500 text-navy-600 text-sm leading-relaxed max-w-xs">
              {t('brandDesc')}
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="dark:text-cream-300 text-navy-800 text-xs font-semibold uppercase tracking-wider mb-4">{category}</p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.openChat ? (
                      <button
                        type="button"
                        onClick={() => window.$chatwoot?.toggle?.('open')}
                        className="dark:text-cream-500 text-navy-600 text-sm dark:hover:text-cream-200 hover:text-navy-900 transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <a
                        href={item.href}
                        className="dark:text-cream-500 text-navy-600 text-sm dark:hover:text-cream-200 hover:text-navy-900 transition-colors"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t dark:border-white/[0.06] border-navy-900/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="dark:text-cream-600 text-navy-500 text-xs">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="dark:text-cream-600 text-navy-500 text-xs flex items-center gap-1.5">
            {t('madeWith')}{' '}
            <svg className="w-3.5 h-3.5 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            {t('forWriters')}
          </p>
        </div>
      </div>
    </footer>
  )
}
