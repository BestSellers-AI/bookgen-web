import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/ui/logo';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center h-dvh bg-muted/30">
      <div className="flex flex-col w-full h-full max-w-2xl bg-background xl:my-6 xl:h-[calc(100dvh-3rem)] xl:rounded-2xl xl:border xl:border-border/50 xl:shadow-lg">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0 xl:rounded-t-2xl">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <LocaleSwitcher />
        </header>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
