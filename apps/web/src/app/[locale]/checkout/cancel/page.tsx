"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function CheckoutCancelPage() {
  const t = useTranslations("checkoutResult");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-[2rem] p-8 md:p-12 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black font-heading">
          {t("cancelTitle")}
        </h1>
        <p className="text-muted-foreground">{t("cancelMessage")}</p>
        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="rounded-xl h-12 font-bold">
            <Link href="/dashboard/upgrade">{t("tryAgain")}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl h-12 font-bold"
          >
            <Link href="/dashboard">{t("goToDashboard")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
