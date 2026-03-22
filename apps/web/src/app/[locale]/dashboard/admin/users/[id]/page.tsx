"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Wallet,
  Crown,
  Calendar,
  BookOpen,
  Loader2,
  Plus,
  Globe,
  MousePointer,
  Eye,
  ShoppingCart,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { adminApi, type AdminUserDetail } from "@/lib/api/admin";
import { UserRole, SubscriptionPlan } from "@bestsellers/shared";
import { toast } from "sonner";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("admin");
  const tStatus = useTranslations("statusLabels");

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [changingRole, setChangingRole] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [addingCredits, setAddingCredits] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [assigningPlan, setAssigningPlan] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminApi.getUser(params.id);
      setUser(data);
      setNewRole(data.role);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchUser();
  }, [params.id]);

  const handleChangeRole = async () => {
    if (!user || !newRole || newRole === user.role) return;
    setChangingRole(true);
    try {
      await adminApi.changeRole(user.id, newRole as UserRole);
      toast.success(t("roleChanged"));
      fetchUser();
    } catch {
      toast.error(t("roleChangeError"));
    } finally {
      setChangingRole(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!user || !newPlan) return;
    setAssigningPlan(true);
    try {
      if (newPlan === "FREE") {
        await adminApi.removePlan(user.id);
        toast.success(t("planRemoved"));
      } else {
        await adminApi.assignPlan(user.id, newPlan as SubscriptionPlan);
        toast.success(t("planAssigned"));
      }
      setNewPlan("");
      fetchUser();
    } catch {
      toast.error(t("planAssignError"));
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleAddCredits = async () => {
    if (!user || !creditAmount || Number(creditAmount) <= 0) return;
    setAddingCredits(true);
    try {
      const res = await adminApi.addCredits(
        user.id,
        Number(creditAmount),
        creditDesc || undefined
      );
      toast.success(t("creditsAdded", { balance: res.balance }));
      setCreditAmount("");
      setCreditDesc("");
      fetchUser();
    } catch {
      toast.error(t("creditsAddError"));
    } finally {
      setAddingCredits(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState onRetry={fetchUser} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-heading font-bold">
          {user.name || user.email}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t("userInfo")}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("name")}</span>
              <span className="font-medium">{user.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("email")}</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{user.phoneNumber || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("role")}</span>
              <Badge
                variant="secondary"
                className={`text-[9px] font-black uppercase ${
                  user.role === "ADMIN"
                    ? "bg-red-500/10 text-red-400"
                    : user.role === "EDITOR"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {user.role}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("plan")}</span>
              <PlanBadge plan={user.subscription?.plan ?? null} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Locale</span>
              <span className="font-medium">{user.locale || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email Verified</span>
              {user.emailVerified ? (
                <Badge variant="secondary" className="text-[9px] font-black bg-emerald-500/10 text-emerald-400">
                  {new Date(user.emailVerified).toLocaleDateString()}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] font-black bg-amber-500/10 text-amber-400">
                  No
                </Badge>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Onboarding</span>
              <Badge
                variant="secondary"
                className={`text-[9px] font-black ${
                  user.onboardingCompleted
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {user.onboardingCompleted ? "Completed" : "Pending"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("joined")}</span>
              <span className="font-medium text-xs">
                {new Date(user.createdAt).toLocaleDateString()}{" "}
                {new Date(user.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("books")}</span>
              <span className="font-mono font-bold">{user.booksCount}</span>
            </div>
            {user.stripeCustomerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe ID</span>
                <span className="font-mono text-xs">{user.stripeCustomerId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Wallet */}
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            {t("walletInfo")}
          </h2>
          <p className="text-3xl font-black">{user.wallet?.balance ?? 0}</p>
        </div>

        {/* Change Role */}
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">{t("changeRole")}</h2>
          <div className="flex gap-3">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="rounded-xl flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.USER}>USER</SelectItem>
                <SelectItem value={UserRole.EDITOR}>EDITOR</SelectItem>
                <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleChangeRole}
              disabled={changingRole || newRole === user.role}
              className="rounded-xl"
            >
              {changingRole ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </div>

        {/* Assign Plan */}
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t("assignPlan")}
          </h2>
          <div className="flex gap-3">
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="rounded-xl flex-1">
                <SelectValue placeholder={t("selectPlan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value={SubscriptionPlan.ASPIRANTE}>Aspiring</SelectItem>
                <SelectItem value={SubscriptionPlan.PROFISSIONAL}>Professional</SelectItem>
                <SelectItem value={SubscriptionPlan.BESTSELLER}>BestSeller</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignPlan}
              disabled={assigningPlan || !newPlan}
              className="rounded-xl"
            >
              {assigningPlan ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("assignPlanBtn")
              )}
            </Button>
          </div>
        </div>

        {/* Add Credits */}
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">{t("addCredits")}</h2>
          <div className="space-y-3">
            <Input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder={t("amount")}
              className="rounded-xl"
              min="1"
            />
            <Input
              value={creditDesc}
              onChange={(e) => setCreditDesc(e.target.value)}
              placeholder={t("description")}
              className="rounded-xl"
            />
            <Button
              onClick={handleAddCredits}
              disabled={addingCredits || !creditAmount || Number(creditAmount) <= 0}
              className="w-full rounded-xl gap-2"
            >
              {addingCredits ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("addCreditsBtn")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      {user.subscription && (
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t("subscriptionInfo")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("plan")}</p>
              <p className="font-bold">{user.subscription.plan}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("status")}</p>
              <p className="font-bold">{tStatus.has(user.subscription.status) ? tStatus(user.subscription.status) : user.subscription.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("billing")}</p>
              <p className="font-bold capitalize">
                {user.subscription.billingInterval.toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("periodEnd")}</p>
              <p className="font-bold text-xs">
                {user.subscription.currentPeriodEnd
                  ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking & Attribution */}
      {(user.source || user.visitorId || user.utmSource || user.deviceType || user.timezone) && (
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-primary" />
            Tracking & Attribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {user.source && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Source</p>
                <Badge variant="secondary" className="text-[9px] font-black uppercase mt-1">
                  {user.source}
                </Badge>
              </div>
            )}
            {user.visitorId && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Visitor ID</p>
                <p className="font-mono text-xs mt-1 truncate">{user.visitorId}</p>
              </div>
            )}
            {user.referrer && (
              <div className="col-span-2 md:col-span-1">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Referrer</p>
                <p className="text-xs mt-1 truncate">{user.referrer}</p>
              </div>
            )}
            {user.deviceType && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Device</p>
                <Badge variant="secondary" className="text-[9px] font-black uppercase mt-1">
                  {user.deviceType}
                </Badge>
              </div>
            )}
            {user.timezone && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Timezone</p>
                <p className="font-medium text-xs mt-1">{user.timezone}</p>
              </div>
            )}
            {user.browserLanguage && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Browser Language</p>
                <p className="font-medium text-xs mt-1">{user.browserLanguage}</p>
              </div>
            )}
            {(user.geoCountry || user.geoCity) && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Location</p>
                <p className="font-medium text-xs mt-1">
                  {[user.geoCity, user.geoCountry].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            {user.utmSource && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">utm_source</p>
                <p className="font-medium text-xs mt-1">{user.utmSource}</p>
              </div>
            )}
            {user.utmMedium && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">utm_medium</p>
                <p className="font-medium text-xs mt-1">{user.utmMedium}</p>
              </div>
            )}
            {user.utmCampaign && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">utm_campaign</p>
                <p className="font-medium text-xs mt-1">{user.utmCampaign}</p>
              </div>
            )}
            {user.utmContent && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">utm_content</p>
                <p className="font-medium text-xs mt-1">{user.utmContent}</p>
              </div>
            )}
            {user.utmTerm && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">utm_term</p>
                <p className="font-medium text-xs mt-1">{user.utmTerm}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Intents */}
      {user.purchaseIntents && user.purchaseIntents.length > 0 && (
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {t("piTitle") || "Purchase Intents"}
            <Badge variant="secondary" className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border-blue-500/20">
              {user.purchaseIntents.length}
            </Badge>
          </h2>
          <div className="space-y-2">
            {user.purchaseIntents.map((pi) => (
              <div
                key={pi.id}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {pi.converted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pi.productSlug}
                      {pi.billingInterval && (
                        <span className="text-muted-foreground ml-1">({pi.billingInterval})</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className={`text-[8px] font-black uppercase ${
                        pi.type === "subscription" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {pi.type === "subscription" ? t("piPlan") || "Plan" : t("piCredits") || "Credits"}
                      </Badge>
                      <Badge variant="secondary" className="text-[8px] font-bold">
                        {pi.source}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(pi.createdAt).toLocaleDateString()}{" "}
                    {new Date(pi.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {pi.converted ? (
                    <p className="text-[10px] text-emerald-400 font-bold">{t("piConverted") || "Converted"}</p>
                  ) : pi.recoveryEmailSentAt ? (
                    <p className="text-[10px] text-blue-400">
                      {t("piRecoverySent")} {new Date(pi.recoveryEmailSentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-400">{t("piAbandoned") || "Abandoned"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
