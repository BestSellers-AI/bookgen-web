import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-16 glass rounded-[3rem] text-center gap-6", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary blur-3xl opacity-20 -m-4 rounded-full" />
        <div className="w-20 h-20 rounded-[1.5rem] bg-card border border-border flex items-center justify-center relative z-10">
          <Icon size={40} className="text-primary" />
        </div>
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="text-2xl font-heading font-bold text-gradient">{title}</h3>
        {description && (
          <p className="text-muted-foreground font-medium leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
