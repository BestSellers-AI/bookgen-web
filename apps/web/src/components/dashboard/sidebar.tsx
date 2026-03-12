"use client";

import { BookOpen, Library, PlusCircle, Wallet as WalletIcon, User, LogOut, ShieldCheck, Users, CreditCard, Package, Settings2, Megaphone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { UserRole } from "@bestsellers/shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useWalletStore } from "@/stores/wallet-store";
import { motion } from "framer-motion";
import { PlanBadge } from "./plan-badge";

export function Sidebar() {
  const wallet = useWalletStore((s) => s.wallet);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const navItems = [
    { label: t("myBooks"), icon: Library, href: "/dashboard/books" },
    { label: t("createNew"), icon: PlusCircle, href: "/dashboard/create" },
    { label: t("wallet"), icon: WalletIcon, href: "/dashboard/wallet" },
    { label: t("profileSettings"), icon: User, href: "/dashboard/settings" },
  ];

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

  const walletDisplay = wallet
    ? `${wallet.balance} ${tCommon("credits")}`
    : `0 ${tCommon("credits")}`;

  return (
    <aside className="fixed left-6 top-[calc(var(--announcement-h,0px)+1.5rem)] bottom-6 w-64 hidden xl:flex flex-col glass rounded-[2rem] p-6 shadow-2xl z-50">
      <Link href="/dashboard" className="mb-6 hover:opacity-80 transition-opacity">
        <Logo size="md" />
      </Link>

      <nav className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={`group justify-start gap-3 h-12 px-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              asChild
            >
              <Link href={item.href}>
                <item.icon
                  className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-primary" : ""
                  }`}
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            </Button>
          );
        })}
        {/* Admin Section */}
        {user?.role === UserRole.ADMIN && (
          <>
            <div className="my-2 border-t border-border" />
            {[
              { label: t("adminDashboard") || "Admin", icon: ShieldCheck, href: "/dashboard/admin" },
              { label: t("adminUsers") || "Users", icon: Users, href: "/dashboard/admin/users" },
              { label: t("adminBooks") || "Books", icon: BookOpen, href: "/dashboard/admin/books" },
              { label: t("adminSubs") || "Subscriptions", icon: CreditCard, href: "/dashboard/admin/subscriptions" },
              { label: t("adminPurchases") || "Purchases", icon: Package, href: "/dashboard/admin/purchases" },
              { label: t("adminProducts") || "Products", icon: Settings2, href: "/dashboard/admin/products" },
              { label: t("adminAnnouncement") || "Announcement", icon: Megaphone, href: "/dashboard/admin/announcement" },
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`group justify-start gap-3 h-10 px-4 rounded-2xl transition-all duration-300 text-xs ${
                    isActive
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className={`w-4 h-4 ${isActive ? "text-red-400" : ""}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </>
        )}
      </nav>

      <div className="mt-4 flex flex-col gap-3 shrink-0">
        <Link href="/dashboard/wallet" className="block p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-2 hover:bg-primary/15 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                {t("walletBalance")}
              </span>
            </div>
          </div>
          <div className="text-lg font-black text-foreground">{walletDisplay}</div>
        </Link>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/50 border border-border">
          <Link href="/dashboard/settings" className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={user?.avatarUrl ?? ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {user?.name ? getInitials(user.name) : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">{user?.name || "User"}</span>
              <PlanBadge plan={user?.planInfo?.plan ?? null} />
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
