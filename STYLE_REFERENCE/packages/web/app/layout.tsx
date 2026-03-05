import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Best Sellers AI — Crie, publique e venda livros com IA',
  description:
    'Crie livros profissionais com inteligência artificial em minutos. Capa, tradução e publicação na Amazon. Sem experiência prévia necessária.',
  keywords: ['criar livro com IA', 'publicar ebook', 'inteligência artificial', 'bestseller', 'publicação amazon'],
  openGraph: {
    title: 'Best Sellers AI — Seu próximo bestseller começa aqui',
    description: 'Crie, personalize e publique livros profissionais com IA em minutos.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-inter bg-navy-900 text-cream-200 antialiased">
        {children}
      </body>
    </html>
  )
}
