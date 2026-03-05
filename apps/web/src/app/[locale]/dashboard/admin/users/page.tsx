"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { adminApi, type AdminUserSummary } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";
import type { PaginationMeta } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        page,
        perPage: 20,
        search: debouncedSearch || undefined,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title={t("usersTitle")} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchUsers")}
          className="pl-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("name")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("email")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("role")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("plan")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("books")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("balance")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("joined")}
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      {user.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={user.activePlan} />
                    </td>
                    <td className="px-6 py-4 font-mono">{user.booksCount}</td>
                    <td className="px-6 py-4 font-mono">{user.balance}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/admin/users/${user.id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
