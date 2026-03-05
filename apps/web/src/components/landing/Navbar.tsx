'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Logo } from '@/components/ui/logo'

export default function Navbar() {
  const t = useTranslations('landingV2.nav')
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: t('plans'), href: '#planos' },
    { label: t('howItWorks'), href: '#como-funciona' },
    { label: t('faq'), href: '#faq' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'dark:bg-navy-900/90 bg-cream-50/90 backdrop-blur-lg border-b dark:border-white/[0.06] border-navy-900/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <nav className="flex items-center justify-between h-16 md:h-18">
          <a href="#" aria-label="Best Sellers AI — Home">
            <Logo />
          </a>

          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-4 py-2 text-sm dark:text-cream-400 text-navy-700 dark:hover:text-cream-200 hover:text-navy-900 rounded-lg dark:hover:bg-white/[0.05] hover:bg-navy-900/[0.05] transition-all duration-150"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login" className="text-sm dark:text-cream-400 text-navy-700 dark:hover:text-cream-200 hover:text-navy-900 transition-colors px-3 py-2">
              {t('signIn')}
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2.5 px-5 animate-pulse-gold">
              {t('createFree')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <button
            className="md:hidden p-2 dark:text-cream-400 text-navy-700 dark:hover:text-cream-200 hover:text-navy-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden dark:bg-navy-800/95 bg-cream-50/95 backdrop-blur-lg border-b dark:border-white/[0.06] border-navy-900/[0.06] overflow-hidden"
          >
            <div className="section-container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 dark:text-cream-300 text-navy-800 dark:hover:text-cream-100 hover:text-navy-900 dark:hover:bg-white/[0.05] hover:bg-navy-900/[0.05] rounded-lg transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t dark:border-white/[0.06] border-navy-900/[0.06] flex flex-col gap-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm dark:text-cream-400 text-navy-700">{t('theme') ?? 'Theme'}</span>
                  <ThemeToggle />
                </div>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="btn-primary justify-center">
                  {t('createFree')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
