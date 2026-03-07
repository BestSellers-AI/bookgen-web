"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  Crown,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Globe,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const t = useTranslations("settings");
  const tErr = useTranslations("errors");
  const [name, setName] = useState(user?.name || "");
  const [locale, setLocale] = useState(user?.locale || "en");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [saving, setSaving] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.locale) setLocale(user.locale);
    setPhoneNumber(user?.phoneNumber || "");
  }, [user?.name, user?.locale, user?.phoneNumber]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, locale, phoneNumber: phoneNumber || undefined });
      toast.success(tErr("profileUpdateSuccess"));
    } catch {
      toast.error(tErr("profileUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      await subscriptionsApi.cancel(true);
      toast.success(t("subscriptionCancelled"));
      window.location.reload();
    } catch {
      toast.error(t("cancelError"));
    } finally {
      setCancellingSubscription(false);
    }
  };

  const getInitials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const hasSubscription = user?.planInfo?.hasSubscription ?? false;
  const planInfo = user?.planInfo;
  const subscription = planInfo?.subscription;
  const isCancelled = subscription?.cancelAtPeriodEnd ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <div className="glass p-8 rounded-[2rem] border border-border space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-heading">
              {t("personalInfo")}
            </h2>
          </div>

          <div className="flex justify-center">
            <Avatar className="w-20 h-20 border-4 border-primary/20">
              <AvatarImage src={user?.avatarUrl ?? ""} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {user?.name ? getInitials(user.name) : "??"}
              </AvatarFallback>
            </Avatar>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                {t("fullName")}
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                {t("email")}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="pl-12 h-12 rounded-2xl bg-muted/50 border-border opacity-60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                {t("preferredLanguage")}
              </label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full pl-12 h-12 rounded-2xl bg-muted/50 border border-border focus:border-primary/50 transition-all appearance-none text-sm text-foreground"
                >
                  <option value="en">{t("languageEn")}</option>
                  <option value="pt-BR">{t("languagePtBR")}</option>
                  <option value="es">{t("languageEs")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                {t("phoneNumber")}
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t("phoneNumberPlaceholder")}
                  className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving || (name === user?.name && locale === user?.locale && (phoneNumber || "") === (user?.phoneNumber || ""))}
              className="w-full h-12 rounded-2xl font-bold"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("saveChanges")
              )}
            </Button>
          </form>
        </div>

        {/* Plan & Subscription Section */}
        <div className="glass p-8 rounded-[2rem] border border-border space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-heading">{t("planTitle")}</h2>
          </div>

          <div className="p-4 rounded-2xl bg-accent/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t("currentPlan")}
              </span>
              <PlanBadge plan={planInfo?.plan ?? null} />
            </div>

            {hasSubscription && subscription && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("creditsPerMonth")}
                  </span>
                  <span className="text-sm font-bold">
                    {planInfo?.limits.monthlyCredits}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("billing")}
                  </span>
                  <span className="text-sm font-bold capitalize">
                    {subscription.billingInterval.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {isCancelled ? t("activeUntil") : t("nextRenewal")}
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}

            {isCancelled && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-500 font-medium">
                  {t("cancelledWarning", {
                    date: new Date(
                      subscription!.currentPeriodEnd
                    ).toLocaleDateString(),
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              asChild
              className="w-full h-12 rounded-xl font-bold gap-2"
            >
              <Link href="/dashboard/upgrade">
                {hasSubscription ? t("managePlan") : t("subscribeCta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            {hasSubscription && !isCancelled && (
              <ConfirmDialog
                title={t("cancelTitle")}
                description={t("cancelConfirm")}
                confirmLabel={t("confirmCancel")}
                variant="destructive"
                onConfirm={handleCancelSubscription}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/20"
                    disabled={cancellingSubscription}
                  >
                    {cancellingSubscription ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("cancelSubscription")
                    )}
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass p-8 rounded-[2rem] border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-xl font-bold font-heading text-red-500">
            {t("dangerZone")}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("dangerZoneDesc")}
        </p>
      </div>
    </div>
  );
}
