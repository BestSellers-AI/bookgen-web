"use client";

import { PlusCircle, Wallet, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function QuickActions() {
  const t = useTranslations("dashboard");

  const actions = [
    {
      label: t("createBook"),
      icon: PlusCircle,
      href: "/dashboard/create",
      className: "bg-primary hover:bg-primary/90 text-white glow-primary",
    },
    {
      label: t("buyCredits"),
      icon: Wallet,
      href: "/dashboard/wallet",
      className: "bg-emerald-500 hover:bg-emerald-500/90 text-white",
    },
    {
      label: t("viewBooks"),
      icon: Library,
      href: "/dashboard/books",
      className: "bg-accent hover:bg-accent/80 text-foreground",
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Button
          key={action.href}
          asChild
          className={`h-11 px-6 rounded-xl font-semibold gap-2 ${action.className}`}
        >
          <Link href={action.href}>
            <action.icon className="w-4 h-4" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
