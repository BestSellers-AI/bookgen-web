import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/ui/logo';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing relative flex flex-col items-center" style={{ height: "calc(100dvh - var(--announcement-h, 0px))", backgroundColor: "var(--landing-bg)" }}>
      {/* Desktop: grid + gradient on outer bg */}
      <div className="hidden xl:block absolute inset-0 bg-grid pointer-events-none" />
      <div className="hidden xl:block absolute inset-0 bg-hero-radial pointer-events-none" />
      <div className="relative flex flex-col w-full h-full max-w-2xl xl:my-6 xl:h-[calc(100dvh-3rem)] xl:rounded-2xl xl:border xl:border-border/50 xl:shadow-lg overflow-hidden bg-background">
        {/* Mobile: grid + gradient inside chat */}
        <div className="xl:hidden absolute inset-0 bg-grid pointer-events-none" style={{ backgroundColor: "var(--landing-bg)" }} />
        <div className="xl:hidden absolute inset-0 bg-hero-radial pointer-events-none" />
        {/* Desktop: subtle gradient inside */}
        <div className="hidden xl:block absolute inset-0 bg-hero-radial opacity-50 pointer-events-none" />
        <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0 xl:rounded-t-2xl">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </header>
        <main className="relative z-10 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
