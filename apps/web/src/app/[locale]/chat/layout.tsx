import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/ui/logo';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
