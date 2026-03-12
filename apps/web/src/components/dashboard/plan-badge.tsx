"use client";

import { Badge } from "@/components/ui/badge";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  ASPIRANTE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PROFISSIONAL: "bg-primary/10 text-primary border-primary/20",
  BESTSELLER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

interface PlanBadgeProps {
  plan: string | null;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const label = plan ?? "FREE";
  const colorClass = PLAN_COLORS[label] ?? PLAN_COLORS.FREE;

  return (
    <Badge
      variant="secondary"
      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${colorClass}`}
    >
      {label}
    </Badge>
  );
}
