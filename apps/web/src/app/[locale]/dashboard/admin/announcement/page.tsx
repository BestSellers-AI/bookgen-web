"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save,
  Loader2,
  Megaphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";
import type { AnnouncementConfigPayload } from "@bestsellers/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Area = "public" | "dashboard" | "chat";
type Style = "static" | "marquee";
type Theme = "gradient" | "solid" | "primary";

const AREAS: { value: Area; label: string }[] = [
  { value: "public", label: "Public (Home / LP)" },
  { value: "dashboard", label: "Dashboard" },
  { value: "chat", label: "Chat" },
];

const STYLES: { value: Style; label: string }[] = [
  { value: "static", label: "Static (centered)" },
  { value: "marquee", label: "Marquee (scrolling)" },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: "gradient", label: "Gradient (amber → orange)" },
  { value: "solid", label: "Solid (accent)" },
  { value: "primary", label: "Primary" },
];

const LOCALES = ["en", "pt-BR", "es"] as const;
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "pt-BR": "Português (BR)",
  es: "Español",
};

const emptyConfig: AnnouncementConfigPayload = {
  enabled: false,
  style: "static",
  areas: ["public", "dashboard"],
  theme: "gradient",
  dismissible: true,
  messages: {
    en: { message: "", linkText: "" },
    "pt-BR": { message: "", linkText: "" },
    es: { message: "", linkText: "" },
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminAnnouncementPage() {
  const t = useTranslations("admin");
  const [config, setConfig] = useState<AnnouncementConfigPayload>(emptyConfig);
  const [linkHref, setLinkHref] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const configs = await adminApi.getAppConfigs();
      const found = configs.find((c) => c.key === "ANNOUNCEMENT");
      if (found?.value) {
        const val = found.value as unknown as AnnouncementConfigPayload;
        setConfig({
          ...emptyConfig,
          ...val,
          messages: {
            en: { ...emptyConfig.messages.en, ...val.messages?.en },
            "pt-BR": { ...emptyConfig.messages["pt-BR"], ...val.messages?.["pt-BR"] },
            es: { ...emptyConfig.messages.es, ...val.messages?.es },
          },
        });
        setLinkHref(val.link?.href ?? "");
      }
    } catch {
      toast.error("Failed to load announcement config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: AnnouncementConfigPayload = {
        ...config,
        link: linkHref.trim() ? { href: linkHref.trim() } : undefined,
      };
      await adminApi.updateAppConfig("ANNOUNCEMENT", payload as unknown as Record<string, any>);
      toast.success("Announcement updated!");
    } catch {
      toast.error("Failed to save announcement config");
    } finally {
      setSaving(false);
    }
  };

  const toggleArea = (area: Area) => {
    setConfig((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  };

  const updateMessage = (locale: string, field: "message" | "linkText", value: string) => {
    setConfig((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [locale]: {
          ...prev.messages[locale as keyof typeof prev.messages],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("announcement") || "Announcement Bar"} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title={t("announcement") || "Announcement Bar"} />

      {/* Preview */}
      {config.enabled && config.messages.en.message && (
        <div className={`rounded-xl text-sm font-medium overflow-hidden ${
          config.theme === "gradient" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" :
          config.theme === "solid" ? "bg-accent text-accent-foreground border border-border" :
          "bg-primary text-primary-foreground"
        }`}>
          <div className="flex items-center justify-center py-2.5 px-4 text-center">
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
              <span>{config.messages["pt-BR"].message || config.messages.en.message}</span>
              {linkHref && (config.messages["pt-BR"].linkText || config.messages.en.linkText) && (
                <span className="underline underline-offset-2 font-bold">
                  {config.messages["pt-BR"].linkText || config.messages.en.linkText}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Enable / Disable */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-accent/50 border border-border">
        <div className="flex items-center gap-3">
          {config.enabled ? (
            <Eye className="w-5 h-5 text-emerald-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {config.enabled ? "Announcement is active" : "Announcement is disabled"}
            </p>
            <p className="text-xs text-muted-foreground">
              Toggle to show/hide the bar across the app
            </p>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
        />
      </div>

      {/* Style & Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={config.style}
            onValueChange={(v) => setConfig((prev) => ({ ...prev, style: v as Style }))}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <Select
            value={config.theme}
            onValueChange={(v) => setConfig((prev) => ({ ...prev, theme: v as Theme }))}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((th) => (
                <SelectItem key={th.value} value={th.value}>{th.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Areas */}
      <div className="space-y-2">
        <Label>Visible areas</Label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => {
            const active = config.areas.includes(a.value);
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => toggleArea(a.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent/50 text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dismissible */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
        <div>
          <p className="text-sm font-medium">Dismissible</p>
          <p className="text-xs text-muted-foreground">Users can close the bar (per session)</p>
        </div>
        <Switch
          checked={config.dismissible ?? false}
          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, dismissible: checked }))}
        />
      </div>

      {/* Link */}
      <div className="space-y-2">
        <Label>Link URL (optional)</Label>
        <Input
          value={linkHref}
          onChange={(e) => setLinkHref(e.target.value)}
          placeholder="/dashboard/create"
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          If set, the link text for each locale will be shown as a clickable link
        </p>
      </div>

      {/* Messages per locale */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Messages per locale
        </Label>

        {LOCALES.map((locale) => (
          <div key={locale} className="p-4 rounded-xl bg-accent/30 border border-border space-y-3">
            <p className="text-sm font-bold">{LOCALE_LABELS[locale]}</p>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea
                value={config.messages[locale].message}
                onChange={(e) => updateMessage(locale, "message", e.target.value)}
                placeholder={`Announcement message in ${LOCALE_LABELS[locale]}`}
                className="rounded-xl min-h-[60px] resize-none"
                rows={2}
              />
            </div>
            {linkHref.trim() && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Link text</Label>
                <Input
                  value={config.messages[locale].linkText ?? ""}
                  onChange={(e) => updateMessage(locale, "linkText", e.target.value)}
                  placeholder={`e.g. Learn more →`}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        size="lg"
        className="w-full rounded-xl"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Save Announcement
      </Button>
    </div>
  );
}
