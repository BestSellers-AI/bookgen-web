"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";
import { UserRole } from "@bestsellers/shared";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== UserRole.ADMIN && user.role !== UserRole.EDITOR) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || (user.role !== UserRole.ADMIN && user.role !== UserRole.EDITOR)) {
    return null;
  }

  return <>{children}</>;
}
