"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { spacing } from "@/lib/design-tokens";
import { formatInr } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  Recommendation,
  UpcomingDue
} from "@/shared/domain/finance";

interface InsightsState {
  snapshot: FinancialSnapshot;
  moneyBreakdown: MoneyBreakdown;
  loans: Loan[];
  upcomingDues: UpcomingDue[];
}

interface RankedInsight {
  recommendation: Recommendation;
  priority: number;
  why: string;
  href: string;
  impactLabel: string;
}

export default function InsightsPage() {
  const router = useRouter();
  const [state, setState] = useState<InsightsState | null>(null);

  const loadInsights = useCallback(async () => {
    const [profile, moneyBreakdown, loans, upcomingDues] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.getMoneyBreakdown(),
      financeRepository.listLoans(),
      financeRepository.listUpcomingDues()
    ]);

    if (!profile?.onboardingCompleted || !moneyBreakdown) {
      router.replace("/onboarding");
      return;
    }

    setState({
      moneyBreakdown,
      loans,
      upcomingDues,
      snapshot: createFinancialSnapshot({
        money: moneyBreakdown,
        loans,
        upcomingDues
      })
    });
  }, [router]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  useFinanceDataReload(() => {
    void loadInsights();
  });

  const rankedInsights = state ? rankInsights(state) : [];
  const primaryInsight = rankedInsights[0];
  const supportingInsights = rankedInsights.slice(1);
  const weeklyReview = state ? getWeeklyReview(state) : null;

  return (
    <MobileShell>
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Intelligence
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            What matters this month
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Clear, rule-based guidance from your on-device financial data.
          </p>
        </header>

        {primaryInsight ? (
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Start here
            </p>
            <Card className="space-y-5 bg-primary text-primary-foreground">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
                  {primaryInsight.recommendation.category.replace("-", " ")}
                </p>
                <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                  {primaryInsight.recommendation.title}
                </h2>
                <p className="text-sm leading-6 opacity-70">
                  {primaryInsight.recommendation.description}
                </p>
              </div>

              <MetricCardGrid>
                <MetricCard
                  label="Why now"
                  value={primaryInsight.why}
                  valueKind="text"
                  variant="dark"
                />
                <MetricCard
                  label="Impact"
                  value={primaryInsight.impactLabel}
                  valueKind="text"
                  variant="dark"
                />
              </MetricCardGrid>

              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={primaryInsight.href}>
                  {primaryInsight.recommendation.actionLabel ?? "Review"}
                </Link>
              </Button>
            </Card>
          </section>
        ) : null}

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Next best actions
          </p>
          {supportingInsights.map((insight) => (
            <Card key={insight.recommendation.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {insight.recommendation.category.replace("-", " ")}
                  </p>
                  <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                    {insight.recommendation.title}
                  </h2>
                </div>
                <div className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                  #{insight.priority}
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {insight.recommendation.description}
              </p>
              <MetricCardGrid>
                <MetricCard label="Why" value={insight.why} valueKind="text" />
                <MetricCard label="Impact" value={insight.impactLabel} valueKind="text" />
              </MetricCardGrid>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={insight.href}>
                  {insight.recommendation.actionLabel ?? "Review"}
                </Link>
              </Button>
            </Card>
          ))}
          {!state ? (
            <Card>
              <p className="text-sm leading-6 text-muted-foreground">
                Reading your private on-device ledger.
              </p>
            </Card>
          ) : null}
          {state && rankedInsights.length === 0 ? (
            <Card>
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                Nothing urgent right now.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Your local data does not show an urgent action. Keep commitments updated
                so insights stay useful.
              </p>
            </Card>
          ) : null}
        </section>

        {weeklyReview ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Weekly review
            </p>
            <Card className="space-y-4">
              <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                {weeklyReview.title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {weeklyReview.description}
              </p>
              <MetricCardGrid>
                <MetricCard label="Available" value={formatInr(weeklyReview.availableMoney)} />
                <MetricCard label="Due soon" value={String(weeklyReview.dueSoonCount)} />
              </MetricCardGrid>
            </Card>
          </section>
        ) : null}
      </div>
    </MobileShell>
  );
}

function rankInsights(state: InsightsState): RankedInsight[] {
  return state.snapshot.recommendations
    .map((recommendation) => ({
      recommendation,
      priority: getRecommendationPriority(recommendation),
      why: getWhyItMatters(recommendation, state),
      href: getRecommendationHref(recommendation, state),
      impactLabel: getImpactLabel(recommendation, state)
    }))
    .sort((first, second) => first.priority - second.priority)
    .slice(0, 4);
}

function getRecommendationPriority(recommendation: Recommendation) {
  const toneRank = {
    critical: 1,
    warning: 2,
    positive: 3,
    neutral: 4
  } as const;

  return toneRank[recommendation.tone];
}

function getWhyItMatters(recommendation: Recommendation, state: InsightsState) {
  if (recommendation.category === "due-date") {
    const urgentDue = getUrgentDue(state.upcomingDues);
    return urgentDue ? `${urgentDue.title} is closest on the calendar.` : "A due date needs review.";
  }

  if (recommendation.category === "debt") {
    const loan = getHighestInterestLoan(state.loans);
    return loan ? `${loan.annualInterestRate}% p.a. is your highest loan rate.` : "Debt cost can compound quietly.";
  }

  if (recommendation.category === "cash-flow") {
    return `${formatInr(state.snapshot.availableMoney)} is available after commitments.`;
  }

  if (recommendation.category === "buffer") {
    return "Emergency buffer protects future payments.";
  }

  return "This can improve your next financial decision.";
}

function getRecommendationHref(recommendation: Recommendation, state: InsightsState) {
  if (recommendation.category === "debt") {
    const loan = getHighestInterestLoan(state.loans);
    return loan ? `/loans/${loan.id}` : "/loans";
  }

  if (recommendation.category === "cash-flow" || recommendation.category === "buffer") {
    return "/money";
  }

  if (recommendation.category === "due-date") {
    const due = getUrgentDue(state.upcomingDues);
    const relatedLoan = due ? state.loans.find((loan) => due.id.includes(loan.id)) : null;
    return relatedLoan ? `/loans/${relatedLoan.id}` : "/loans";
  }

  return "/";
}

function getImpactLabel(recommendation: Recommendation, state: InsightsState) {
  if (recommendation.category === "debt") {
    const loan = getHighestInterestLoan(state.loans);
    return loan ? `Est. ${formatInr(estimateMonthlyInterest(loan))}/mo interest` : "Lower interest drag";
  }

  if (recommendation.category === "cash-flow") {
    return state.snapshot.availableMoney >= 0 ? "Decision room" : "Shortfall risk";
  }

  if (recommendation.category === "due-date") {
    const due = getUrgentDue(state.upcomingDues);
    return due ? formatInr(due.amount) : "Avoid penalty";
  }

  return "Better clarity";
}

function getWeeklyReview(state: InsightsState) {
  const dueSoonCount = state.upcomingDues.filter((due) => {
    const daysUntilDue = getDaysUntil(due.dueDate);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).length;

  return {
    title: "Your week in one sentence.",
    description:
      state.snapshot.availableMoney >= 0
        ? `You have room to decide, but ${dueSoonCount} upcoming commitment${dueSoonCount === 1 ? "" : "s"} should stay protected.`
        : "This week is tight. Focus on mandatory commitments before optional spending.",
    availableMoney: state.snapshot.availableMoney,
    dueSoonCount
  };
}

function getHighestInterestLoan(loans: Loan[]) {
  return [...loans].sort(
    (first, second) => second.annualInterestRate - first.annualInterestRate
  )[0];
}

function estimateMonthlyInterest(loan: Loan) {
  return Math.round(loan.outstandingBalance * (loan.annualInterestRate / 12 / 100));
}

function getUrgentDue(upcomingDues: UpcomingDue[]) {
  return [...upcomingDues]
    .filter((due) => getDaysUntil(due.dueDate) >= 0)
    .sort((first, second) => getDaysUntil(first.dueDate) - getDaysUntil(second.dueDate))[0];
}

function getDaysUntil(date: string) {
  const targetDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000);
}
