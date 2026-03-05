"use client";

import { useState } from "react";
import { Copy, Loader2, Trash2, Eye } from "lucide-react";
import { shareApi } from "@/lib/api/share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { BookDetail } from "@/lib/api/types";

interface ShareDialogProps {
  book: BookDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
}

export function ShareDialog({ book, open, onOpenChange, onRefetch }: ShareDialogProps) {
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const t = useTranslations("book");
  const tErr = useTranslations("errors");

  const share = book.share;
  const hasActiveShare = share && share.isActive;

  const handleCreate = async () => {
    setCreating(true);
    try {
      await shareApi.create(book.id);
      onRefetch();
    } catch {
      toast.error(tErr("generic"));
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async () => {
    if (!share) return;
    setRemoving(true);
    try {
      await shareApi.delete(book.id, share.id);
      onRefetch();
    } catch {
      toast.error(tErr("generic"));
    } finally {
      setRemoving(false);
    }
  };

  const handleCopy = async () => {
    if (!share?.shareUrl) return;
    await navigator.clipboard.writeText(share.shareUrl);
    toast.success(t("linkCopied"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("share")}</DialogTitle>
        </DialogHeader>

        {hasActiveShare ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("shareLinkActive")}
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={share.shareUrl}
                  className="text-xs"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {t("shareViews", { count: share.viewCount })}
            </div>

            <ConfirmDialog
              title={t("removeShare")}
              description={t("removeShareConfirm")}
              confirmLabel={t("removeShare")}
              onConfirm={handleRemove}
              destructive
              trigger={
                <Button
                  variant="outline"
                  className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10"
                  disabled={removing}
                >
                  {removing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t("removeShare")}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("createShareLink")}
            </p>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("createShareLink")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
