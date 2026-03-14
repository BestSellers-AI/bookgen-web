import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthBootstrap } from '@/components/auth-bootstrap';
import { ConfigInitializer } from '@/components/config-initializer';
import { LocaleSync } from '@/components/locale-sync';
import { Toaster } from 'sonner';
import { AnnouncementBar } from '@/components/announcement-bar/announcement-bar';
import { ChatwootWidget } from '@/components/dashboard/chatwoot-widget';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthBootstrap />
        <ConfigInitializer />
        <LocaleSync />
        <AnnouncementBar />
        {children}
        <ChatwootWidget />
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
