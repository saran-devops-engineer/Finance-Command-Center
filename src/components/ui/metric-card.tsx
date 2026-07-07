import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { card, metric, radius, spacing } from "@/lib/design-tokens";

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
        "flex min-w-0 flex-col",
        metric.height,
        card.paddingMetric,
        radius.card,
        variant === "dark" ? "bg-white/10 text-inherit" : "bg-white/45 text-foreground",
        className
      )}
    >
      <p
        className={cn(
          metric.labelHeight,
          "shrink-0 text-xs font-medium leading-4 line-clamp-2",
          variant === "dark" ? "opacity-60" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          metric.labelToValue,
          "min-w-0 break-words text-base font-semibold leading-tight tracking-[-0.02em]"
        )}
      >
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
        "grid",
        spacing.metricGrid,
        columns === 3 ? "grid-cols-3" : "grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}
