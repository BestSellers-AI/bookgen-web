"use client";

import { BookCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import type { PublishingRequestSummary } from "@/lib/api/types";
import { ProductKind } from "@bestsellers/shared";

interface PublishingResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishing: PublishingRequestSummary;
  addonKind: string;
}

export function PublishingResultSheet({ open, onOpenChange, publishing, addonKind }: PublishingResultSheetProps) {
  const t = useTranslations("publishingResult");
  const tStatus = useTranslations("publishingStatus");

  const isPremium = addonKind === ProductKind.ADDON_AMAZON_PREMIUM;
  const isPublished = publishing.status === "PUBLISHED";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookCheck className="w-5 h-5 text-blue-500" />
            {t("title")}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  isPremium
                    ? "bg-amber-500/10 text-amber-400 text-xs font-bold"
                    : "bg-blue-500/10 text-blue-400 text-xs font-bold"
                }
              >
                {isPremium ? t("premium") : t("standard")}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-[9px] font-black uppercase tracking-widest ${
                  isPublished
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {tStatus.has(publishing.status) ? tStatus(publishing.status as "PREPARING" | "REVIEW" | "READY" | "SUBMITTED" | "PUBLISHED" | "REJECTED" | "CANCELLED") : publishing.status}
              </Badge>
            </div>
          </SheetDescription>
        </SheetHeader>

        {isPublished ? (
          <div className="space-y-4 pb-6">
            {publishing.publishedUrl && (
              <div className="p-4 rounded-xl bg-accent/30 border border-border">
                <p className="text-xs font-bold text-muted-foreground mb-1">{t("amazonUrl")}</p>
                <a
                  href={publishing.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 break-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {publishing.publishedUrl}
                </a>
              </div>
            )}

            {publishing.amazonAsin && (
              <div className="p-4 rounded-xl bg-accent/30 border border-border">
                <p className="text-xs font-bold text-muted-foreground mb-1">{t("asin")}</p>
                <p className="text-sm font-mono font-bold">{publishing.amazonAsin}</p>
              </div>
            )}

            {publishing.kdpUrl && (
              <div className="p-4 rounded-xl bg-accent/30 border border-border">
                <p className="text-xs font-bold text-muted-foreground mb-1">{t("kdpUrl")}</p>
                <a
                  href={publishing.kdpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 break-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {publishing.kdpUrl}
                </a>
              </div>
            )}

            {publishing.publishedAt && (
              <div className="p-4 rounded-xl bg-accent/30 border border-border">
                <p className="text-xs font-bold text-muted-foreground mb-1">{t("publishedOn")}</p>
                <p className="text-sm">{new Date(publishing.publishedAt).toLocaleDateString()}</p>
              </div>
            )}

            {publishing.adminNotes && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs font-bold text-blue-400 mb-1">{t("notes")}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{publishing.adminNotes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="pb-6">
            <div className="p-6 rounded-xl bg-accent/30 border border-border text-center">
              <BookCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("noDetails")}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
