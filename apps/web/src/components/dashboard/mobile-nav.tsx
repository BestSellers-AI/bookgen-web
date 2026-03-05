"use client";

import { useState } from "react";
import { Library, PlusCircle, Wallet as WalletIcon, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlanBadge } from "./plan-badge";
import type { WalletInfo } from "@/lib/api/types";

interface MobileNavProps {
  wallet: WalletInfo | null;
}

export function MobileNav({ wallet }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

  const walletDisplay = wallet
    ? `${wallet.balance} ${tCommon("credits")}`
    : `0 ${tCommon("credits")}`;

  const navItems = [
    { label: t("myBooks"), icon: Library, href: "/dashboard/books" },
    { label: t("createNew"), icon: PlusCircle, href: "/dashboard/create" },
    { label: t("wallet"), icon: WalletIcon, href: "/dashboard/wallet" },
    { label: t("profileSettings"), icon: User, href: "/dashboard/settings" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-l border-border text-foreground">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-left text-foreground">{t("menu")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/50 border border-border">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={user?.avatarUrl ?? ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {user?.name ? getInitials(user.name) : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold">{user?.name || "User"}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
              <PlanBadge plan={user?.planInfo?.plan ?? null} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                {t("walletBalance")}
              </span>
            </div>
            <div className="text-xl font-black">{walletDisplay}</div>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`justify-start gap-3 h-12 rounded-xl ${
                    isActive ? "bg-primary/20 text-primary" : ""
                  }`}
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
            <Button
              variant="ghost"
              className="justify-start gap-3 h-12 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <LogOut className="w-5 h-5" />
              <span>{t("logout")}</span>
            </Button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
