"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { walletApi } from "@/lib/api/wallet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CREDITS_COST } from "@bestsellers/shared";

interface CreditCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookTitle: string;
  onSuccess: () => void;
}

export function CreditCheckDialog({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  onSuccess,
}: CreditCheckDialogProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("book");
  const tErr = useTranslations("errors");
  const cost = CREDITS_COST.BOOK_GENERATION;

  useEffect(() => {
    if (open) {
      walletApi.get().then((w) => setBalance(w.balance)).catch(() => setBalance(0));
    }
  }, [open]);

  const hasSufficientCredits = balance !== null && balance >= cost;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await booksApi.approve(bookId).catch(() => {
        // Ignore — book may already be PREVIEW_APPROVED
      });
      await booksApi.generate(bookId);
      toast.success(t("generationStarted"));
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      if (err?.response?.status === 402) {
        toast.error(tErr("insufficientCredits"));
      } else {
        toast.error(tErr("generateFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasSufficientCredits ? t("generateBook") : t("insufficientCredits")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {balance === null ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("loadingBalance")}
              </span>
            ) : hasSufficientCredits ? (
              t("confirmGenerate", { cost, balance, title: bookTitle })
            ) : (
              t("needCredits", { cost, balance })
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancelEdit")}</AlertDialogCancel>
          {hasSufficientCredits ? (
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("generateBook")}
            </AlertDialogAction>
          ) : (
            <Button asChild>
              <Link href="/dashboard/wallet/buy-credits">{t("buyCreditsToGenerate")}</Link>
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
