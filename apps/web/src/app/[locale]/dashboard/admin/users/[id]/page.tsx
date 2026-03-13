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
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("role")}</span>
              <Badge
                variant="secondary"
                className={`text-[9px] font-black uppercase ${
                  user.role === "ADMIN"
                    ? "bg-red-500/10 text-red-400"
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("joined")}</span>
              <span className="font-medium text-xs">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("books")}</span>
              <span className="font-mono font-bold">{user.booksCount}</span>
            </div>
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
                <SelectItem value={SubscriptionPlan.ASPIRANTE}>Aspirante</SelectItem>
                <SelectItem value={SubscriptionPlan.PROFISSIONAL}>Profissional</SelectItem>
                <SelectItem value={SubscriptionPlan.BESTSELLER}>Bestseller</SelectItem>
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
    </div>
  );
}
