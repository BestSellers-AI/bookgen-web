'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const Logo = () => (
  <div className="flex items-center gap-2.5 group">
    {/* Mark: open book + spark */}
    <svg width="48" height="48" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
      <rect width="32" height="32" rx="8" fill="url(#logo-bg)" />
      {/* Book left page */}
      <path d="M8 10C8 10 10 10.5 11.5 11C13 11.5 14 12 14 12V22C14 22 12.8 21.5 11.5 21C10 20.4 8 20 8 20V10Z"
        fill="#F59E0B" opacity="0.9" />
      {/* Book right page */}
      <path d="M24 10C24 10 22 10.5 20.5 11C19 11.5 18 12 18 12V22C18 22 19.2 21.5 20.5 21C22 20.4 24 20 24 20V10Z"
        fill="#FCD34D" opacity="0.75" />
      {/* Spine */}
      <rect x="14.5" y="9" width="3" height="14" rx="0.5" fill="#F59E0B" />
      {/* Spark */}
      <path d="M16 4L16.8 6.5L19.5 6L17.5 7.8L18.5 10.5L16 9L13.5 10.5L14.5 7.8L12.5 6L15.2 6.5L16 4Z"
        fill="#FCD34D" />
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#131627" />
          <stop offset="100%" stopColor="#0D0F1C" />
        </linearGradient>
      </defs>
    </svg>
    <div className="flex flex-col leading-none">
      <span className="font-playfair font-bold text-cream-200 text-lg tracking-tight">
        Best Sellers
      </span>
      <span className="font-inter text-gold-500 text-[11px] font-semibold tracking-[0.18em] uppercase">
        AI Platform
      </span>
    </div>
  </div>
)

const navLinks = [
  { label: 'Planos', href: '#planos' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy-900/90 backdrop-blur-lg border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <nav className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" aria-label="Best Sellers AI — Home">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="px-4 py-2 text-sm text-cream-400 hover:text-cream-200 rounded-lg hover:bg-white/[0.05] transition-all duration-150"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="#planos" className="text-sm text-cream-400 hover:text-cream-200 transition-colors px-3 py-2">
              Entrar
            </Link>
            <Link href="#planos" className="btn-primary text-sm py-2.5 px-5 animate-pulse-gold">
              Criar grátis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-cream-400 hover:text-cream-200"
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-navy-800/95 backdrop-blur-lg border-b border-white/[0.06] overflow-hidden"
          >
            <div className="section-container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-cream-300 hover:text-cream-100 hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-white/[0.06] flex flex-col gap-2">
                <Link href="#planos" onClick={() => setMobileOpen(false)} className="btn-primary justify-center">
                  Criar grátis
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
