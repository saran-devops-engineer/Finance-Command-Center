"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, Lightbulb, PiggyBank, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { card, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { FinancialInsight } from "@/engines/financial-insights";

interface FinancialInsightsSectionProps {
  insights: FinancialInsight[];
  showViewAll?: boolean;
}

export function FinancialInsightsSection({
  insights,
  showViewAll = true
}: FinancialInsightsSectionProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <section className={spacing.section}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Financial Insights
        </p>
        {showViewAll ? (
          <Link href="/insights" className="text-xs font-medium">
            View all
          </Link>
        ) : null}
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}

function InsightCard({ insight }: { insight: FinancialInsight }) {
  const Icon = getInsightIcon(insight.category);

  return (
    <Card className={cn("space-y-3", card.paddingCompact)}>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {formatCategory(insight.category)}
          </p>
          <p className="text-sm leading-6">{insight.message}</p>
        </div>
      </div>

      {insight.href && insight.actionLabel ? (
        <Button asChild size="sm" variant="secondary" className="gap-2">
          <Link href={insight.href}>
            {insight.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </Card>
  );
}

function getInsightIcon(category: FinancialInsight["category"]) {
  switch (category) {
    case "savings":
      return PiggyBank;
    case "warning":
      return TriangleAlert;
    case "opportunity":
      return Lightbulb;
    default:
      return CircleCheck;
  }
}

function formatCategory(category: FinancialInsight["category"]) {
  switch (category) {
    case "savings":
      return "Savings";
    case "warning":
      return "Warning";
    case "opportunity":
      return "Opportunity";
    default:
      return "Status";
  }
}
