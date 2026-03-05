"use client";

import { NotificationPopover } from "./notification-popover";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { Logo } from "@/components/ui/logo";
import type { WalletInfo } from "@/lib/api/types";

interface HeaderProps {
  wallet: WalletInfo | null;
}

export function Header({ wallet }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-6 border-b border-border xl:top-6 xl:left-[19rem] xl:right-6 xl:h-14 xl:rounded-2xl xl:border xl:border-border xl:shadow-lg">
      {/* Mobile: logo | Desktop: empty spacer */}
      <div className="xl:hidden">
        <Logo size="sm" />
      </div>
      <div className="hidden xl:block" />

      <div className="flex items-center gap-1">
        <NotificationPopover />
        <UserMenu />
        <div className="xl:hidden">
          <MobileNav wallet={wallet} />
        </div>
      </div>
    </header>
  );
}
