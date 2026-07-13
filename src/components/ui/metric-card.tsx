"use client";

import { PrivacyMask } from "@/components/ui/privacy-mask";
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { card, metric, radius, spacing } from "@/lib/design-tokens";

type MetricCardGridColumns = 2 | 3;
type MetricValueKind = "number" | "text";

const MetricCardGridContext = createContext<MetricCardGridColumns>(2);

interface MetricCardProps {
  label: string;
  value: ReactNode;
  helper?: string;
  variant?: "light" | "dark";
  valueKind?: MetricValueKind;
}

export function MetricCard({
  label,
  value,
  helper,
  variant = "light",
  valueKind = "number"
}: MetricCardProps) {
  const columns = useContext(MetricCardGridContext);

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden",
        metric.height,
        metric.minHeight,
        metric.maxHeight,
        card.paddingMetric,
        radius.card,
        variant === "dark" ? "bg-white/10 text-inherit" : "bg-white/45 text-foreground"
      )}
    >
      <div className="flex h-full w-full flex-col items-start justify-center">
        <div className={cn("flex w-full min-w-0 flex-col", metric.contentGap)}>
          <p
            className={cn(
              "truncate text-xs font-medium leading-none",
              variant === "dark" ? "opacity-60" : "text-muted-foreground"
            )}
          >
            {label}
          </p>

          {valueKind === "number" ? (
            <PrivacyMask
              as="p"
              className={cn(
                "w-full min-w-0 font-semibold tracking-[-0.02em]",
                "overflow-hidden text-ellipsis whitespace-nowrap tabular-nums leading-none",
                columns === 3 ? metric.value3Col : metric.value2Col
              )}
            >
              {value}
            </PrivacyMask>
          ) : (
            <p
              className={cn(
                "w-full min-w-0 font-semibold tracking-[-0.02em]",
                "line-clamp-2 leading-snug",
                columns === 3 ? metric.textValue3Col : metric.textValue2Col
              )}
            >
              {value}
            </p>
          )}

          {helper ? (
            <p
              className={cn(
                "truncate text-[10px] leading-none",
                variant === "dark" ? "opacity-50" : "text-muted-foreground/80"
              )}
            >
              {helper}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface MetricCardGridProps {
  columns?: MetricCardGridColumns;
  children: ReactNode;
  className?: string;
}

export function MetricCardGrid({
  columns = 2,
  children,
  className
}: MetricCardGridProps) {
  return (
    <MetricCardGridContext.Provider value={columns}>
      <div
        className={cn(
          "grid items-stretch",
          spacing.metricGrid,
          columns === 3 ? "grid-cols-3" : "grid-cols-2",
          className
        )}
      >
        {children}
      </div>
    </MetricCardGridContext.Provider>
  );
}
