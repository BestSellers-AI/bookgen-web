"use client";

import React, { useEffect } from "react";
import { Library, PlusCircle, DollarSign, User } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useWalletStore } from "@/stores/wallet-store";
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
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useNotifications();

  useEffect(() => {
    if (user?.id) fetchWallet();
  }, [user?.id, fetchWallet]);

  return (
    <ProtectedRoute>
      <div className="relative flex min-h-screen font-inter">
        {/* Subtle grid overlay — matches landing page */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <Sidebar />
        <Header />

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
        <main className="flex-1 xl:pl-[19rem] pt-[calc(6rem+var(--announcement-h,0px))] pb-28 xl:pb-12 px-6 xl:px-12 overflow-y-auto">
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
