"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Library, PlusCircle, DollarSign, User } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { walletApi } from "@/lib/api/wallet";
import type { WalletInfo } from "@/lib/api/types";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  useNotifications();

  const fetchWallet = useCallback(async () => {
    if (user?.id) {
      try {
        const data = await walletApi.get();
        setWallet(data);
      } catch (error) {
        console.error("Error fetching wallet:", error);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background font-inter">
        <Sidebar wallet={wallet} />
        <Header wallet={wallet} />

        {/* Mobile Bottom Nav */}
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-xl z-40 flex items-center justify-around px-4 border-t border-border pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <Link
            href="/dashboard/books"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === "/dashboard/books"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Library className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t("myBooks")}</span>
          </Link>

          <div className="flex items-center gap-8 relative -top-6">
            <Link href="/dashboard/wallet">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 rotate-45 ${
                  pathname === "/dashboard/wallet"
                    ? "bg-emerald-500 shadow-emerald-500/40 shadow-lg"
                    : "bg-emerald-500/20 border border-emerald-500/30"
                }`}
              >
                <DollarSign
                  className={`w-8 h-8 -rotate-45 ${
                    pathname === "/dashboard/wallet"
                      ? "text-white"
                      : "text-emerald-500"
                  }`}
                />
              </div>
            </Link>

            <Link href="/dashboard/create">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 rotate-45 ${
                  pathname === "/dashboard/create"
                    ? "bg-primary glow-primary shadow-primary/40"
                    : "bg-primary/20 border border-primary/30"
                }`}
              >
                <PlusCircle
                  className={`w-8 h-8 -rotate-45 ${
                    pathname === "/dashboard/create"
                      ? "text-white"
                      : "text-primary"
                  }`}
                />
              </div>
            </Link>
          </div>

          <Link
            href="/dashboard/settings"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === "/dashboard/settings"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">
              {t("profileSettings")}
            </span>
          </Link>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 xl:pl-[19rem] pt-24 pb-28 xl:pb-12 px-6 xl:px-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
