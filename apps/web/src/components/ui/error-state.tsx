"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ message = "Something went wrong.", onRetry, retryLabel = "Retry", className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center gap-4", className)}>
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="rounded-xl">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
