"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { adminApi, type AdminAppConfig } from "@/lib/api/admin";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const [configs, setConfigs] = useState<AdminAppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAppConfigs();
      setConfigs(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const getConfigValue = (key: string): boolean => {
    const config = configs.find((c) => c.key === key);
    if (!config?.value || typeof config.value !== "object") return false;
    return (config.value as Record<string, unknown>).enabled === true;
  };

  const handleToggle = async (key: string, enabled: boolean) => {
    setSaving(key);
    try {
      await adminApi.updateAppConfig(key, { enabled });
      toast.success(t("settingsSaved"));
      fetchConfigs();
    } catch {
      toast.error(t("settingsSaveError"));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={t("settingsTitle")}
        subtitle={t("settingsSubtitle")}
      />

      {/* Book Generation */}
      <div className="glass rounded-[2rem] p-6 space-y-6">
        <h2 className="text-lg font-bold font-heading flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          {t("settingsGeneration")}
        </h2>

        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-accent/30 border border-border">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("settingsAutoApprove")}</p>
            <p className="text-xs text-muted-foreground">
              {t("settingsAutoApproveDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving === "AUTO_APPROVE_PREVIEW" && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            <Switch
              checked={getConfigValue("AUTO_APPROVE_PREVIEW")}
              onCheckedChange={(checked) => handleToggle("AUTO_APPROVE_PREVIEW", checked)}
              disabled={saving !== null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
