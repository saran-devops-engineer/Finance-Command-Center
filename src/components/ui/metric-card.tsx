import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  variant?: "light" | "dark";
  className?: string;
}

export function MetricCard({
  label,
  value,
  variant = "light",
  className
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex h-32 min-w-0 flex-col rounded-3xl p-5",
        variant === "dark" ? "bg-white/10 text-inherit" : "bg-white/45 text-foreground",
        className
      )}
    >
      <p
        className={cn(
          "h-10 shrink-0 text-xs font-medium leading-4 line-clamp-2",
          variant === "dark" ? "opacity-60" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <p className="mt-3 min-w-0 break-words text-base font-semibold leading-tight tracking-[-0.02em]">
        {value}
      </p>
    </div>
  );
}

interface MetricCardGridProps {
  columns?: 2 | 3;
  children: ReactNode;
  className?: string;
}

export function MetricCardGrid({
  columns = 2,
  children,
  className
}: MetricCardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 3 ? "grid-cols-3" : "grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}
