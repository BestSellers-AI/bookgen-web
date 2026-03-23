"use client";

import { PlusCircle, Wallet, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface QuickActionsProps {
  hasBooks?: boolean;
}

export function QuickActions({ hasBooks }: QuickActionsProps) {
  const t = useTranslations("dashboard");

  const isFirstProject = !hasBooks;
  const createLabel = isFirstProject ? t("startFreeProject") : t("createBook");

  const actions = [
    {
      label: createLabel,
      icon: PlusCircle,
      href: "/dashboard/create",
      className: "bg-blue-500 hover:bg-blue-500/90 text-white",
      highlight: isFirstProject,
    },
    {
      label: t("buyCredits"),
      icon: Wallet,
      href: "/dashboard/upgrade?tab=plans",
      className: "bg-emerald-500 hover:bg-emerald-500/90 text-white",
    },
    {
      label: t("viewBooks"),
      icon: Library,
      href: "/dashboard/books",
      className: "bg-accent hover:bg-accent/80 text-foreground",
      /* Hidden on mobile — remove 'hidden sm:flex' to show on all breakpoints */
      hideOnMobile: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr gap-3">
      {actions.map((action) => {
        const button = (
          <Button
            asChild
            className={`h-11 px-6 rounded-xl font-semibold gap-2 w-full ${'hideOnMobile' in action && action.hideOnMobile ? 'hidden sm:flex' : ''} ${action.className} ${'highlight' in action && action.highlight ? 'rounded-[calc(0.75rem-2px)]' : ''}`}
          >
            <Link href={action.href}>
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          </Button>
        );

        // TODO: revert — spinning border only for first project CTA
        // Rules:
        // - No books/previews → label "Iniciar Meu Projeto Grátis" + spinning border
        // - Has at least 1 book/preview → label "Criar Novo Livro" + normal style (no border)
        if ('highlight' in action && action.highlight) {
          return (
            <div key={action.href} className="relative rounded-xl p-[2px] overflow-hidden w-full">
              <div
                className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
                }}
              />
              {button}
            </div>
          );
        }

        return <div key={action.href}>{button}</div>;
      })}
    </div>
  );
}
