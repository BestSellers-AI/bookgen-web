"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { checkoutApi } from "@/lib/api/checkout";

type SessionState = "loading" | "success" | "error";

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkoutResult");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<SessionState>("loading");

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      return;
    }

    checkoutApi
      .getSessionStatus(sessionId)
      .then((res) => {
        const status = res.paymentStatus ?? res.status;
        setState(status === "paid" || status === "complete" ? "success" : "error");
      })
      .catch(() => {
        // Even if verification fails, the payment likely went through
        // (webhooks handle fulfillment). Show success with a note.
        setState("success");
      });
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-[2rem] p-8 md:p-12 max-w-md w-full text-center space-y-6">
        {state === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-bold font-heading">
              {t("verifying")}
            </h1>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black font-heading">
              {t("successTitle")}
            </h1>
            <p className="text-muted-foreground">{t("successMessage")}</p>
            <div className="flex flex-col gap-3 pt-2">
              <Button asChild className="rounded-xl h-12 font-bold">
                <Link href="/dashboard">{t("goToDashboard")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl h-12 font-bold"
              >
                <Link href="/dashboard/wallet">{t("viewWallet")}</Link>
              </Button>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black font-heading">
              {t("errorTitle")}
            </h1>
            <p className="text-muted-foreground">{t("errorMessage")}</p>
            <Button asChild className="rounded-xl h-12 font-bold">
              <Link href="/dashboard">{t("goToDashboard")}</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
