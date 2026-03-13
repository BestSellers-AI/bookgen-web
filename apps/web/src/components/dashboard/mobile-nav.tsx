"use client";

import { useState } from "react";
import { Library, PlusCircle, Wallet as WalletIcon, User, LogOut, Menu, Crown } from "lucide-react";
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
import { useWalletStore } from "@/stores/wallet-store";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlanBadge } from "./plan-badge";

export function MobileNav() {
  const wallet = useWalletStore((s) => s.wallet);
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
    { label: t("plansAndPricing"), icon: Crown, href: "/dashboard/upgrade", highlight: true },
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
              const hasPlan = !!user?.planInfo?.hasSubscription;
              const highlighted = "highlight" in item && item.highlight && !hasPlan;

              if (highlighted && !isActive) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="relative flex items-center gap-3 h-12 px-4 rounded-xl overflow-hidden transition-all duration-300 border border-gold-500/30 bg-gold-500/5 text-gold-500 hover:bg-gold-500/10 hover:border-gold-500/50 shadow-gold-sm"
                  >
                    <div className="absolute inset-y-0 -inset-x-full w-[200%] animate-shimmer pointer-events-none bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <item.icon className="w-5 h-5 text-gold-500" />
                    <span className="font-bold">{item.label}</span>
                  </Link>
                );
              }

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
