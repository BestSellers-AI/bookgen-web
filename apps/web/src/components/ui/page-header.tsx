import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col md:flex-row justify-between items-start md:items-end gap-6", className)}>
      <div className="space-y-2">
        <h1 className="text-4xl font-heading font-black tracking-tight text-gradient">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-lg font-medium">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
