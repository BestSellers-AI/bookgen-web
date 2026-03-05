"use client";

import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { NotificationPopover } from "./notification-popover";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import type { WalletInfo } from "@/lib/api/types";

interface HeaderProps {
  wallet: WalletInfo | null;
}

export function Header({ wallet }: HeaderProps) {
  return (
    <header className="xl:hidden fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-6 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gradient">BookGen</span>
      </div>

      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <NotificationPopover />
        <UserMenu />
        <MobileNav wallet={wallet} />
      </div>
    </header>
  );
}
