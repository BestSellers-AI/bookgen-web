"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Redirect to the unified Plans & Pricing page (credits tab).
 * Preserves backwards compatibility with bookmarks and external links.
 */
export default function BuyCreditsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/upgrade?tab=credits");
  }, [router]);

  return null;
}
