"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { FinancialAmount } from "@/components/ui/financial-amount";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { spacing } from "@/lib/design-tokens";
import { formatInr } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import { generateAllFinancialInsights } from "@/engines/financial-insights";
import { FinancialInsightsSection } from "@/features/home/financial-insights-section";
import { loadCommandCenterState } from "@/services/dashboard/load-command-center-state";
import { commitmentRecordsToFinancial } from "@/services/cash-flow/commitment-record-bridge";
import type { CashFlowSummary } from "@/services/cash-flow/calculate-cash-flow";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import { CommitmentReviewStatus } from "@/shared/domain/commitment-record";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  Recommendation,
  UpcomingDue
} from "@/shared/domain/finance";
import type { Chit } from "@/shared/domain/chit";
import { AppRoute } from "@/navigation";
import { getPriorityLoan } from "@/features/home/home-helpers";

interface InsightsState {
  snapshot: FinancialSnapshot;
  moneyBreakdown: MoneyBreakdown;
  cashFlow: CashFlowSummary;
  commitments: CommitmentRecord[];
  loans: Loan[];
  chits: Chit[];
  upcomingDues: UpcomingDue[];
  pinnedLoanId: string | null;
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
  const hasTrackedScreenView = useRef(false);

  const loadInsights = useCallback(async () => {
    const next = await loadCommandCenterState(financeRepository);

    if (!next) {
      router.replace("/onboarding");
      return;
    }

    setState({
      moneyBreakdown: next.moneyBreakdown,
      cashFlow: next.cashFlow,
      commitments: next.commitments,
      loans: next.loans,
      chits: next.chits,
      upcomingDues: next.upcomingDues,
      snapshot: next.snapshot,
      pinnedLoanId: next.pinnedLoanId
    });
  }, [router]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    if (state && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(ScreenName.INSIGHTS);
    }
  }, [state]);

  useFinanceDataReload(() => {
    void loadInsights();
  });

  const rankedInsights = state ? rankInsights(state) : [];
  const primaryInsight = rankedInsights[0];
  const supportingInsights = rankedInsights.slice(1);
  const weeklyReview = state ? getWeeklyReview(state) : null;
  const financialInsights = state
    ? generateAllFinancialInsights({
        loans: state.loans,
        chits: state.chits,
        moneyBreakdown: state.moneyBreakdown,
        commitments: commitmentRecordsToFinancial(state.commitments)
      })
    : [];
  const priorityLoan = state ? getPriorityLoan(state.loans, state.pinnedLoanId) : null;
  const needsReviewCount =
    state?.commitments.filter(
      (item) => item.reviewStatus === CommitmentReviewStatus.NEEDS_REVIEW
    ).length ?? 0;

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
            Calculated from income and commitments — no data entry here.
          </p>
        </header>

        {state ? (
          <Card className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Cash flow
              </p>
              <p className="text-4xl font-semibold tracking-[-0.05em]">
                <FinancialAmount amount={state.cashFlow.availableCash} />
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Available after monthly commitments
              </p>
            </div>
            <MetricCardGrid columns={3}>
              <MetricCard
                label="Income"
                value={formatInr(state.cashFlow.totalMonthlyIncome, { compact: true })}
              />
              <MetricCard
                label="Commitments"
                value={formatInr(state.cashFlow.totalMonthlyCommitments, { compact: true })}
              />
              <MetricCard
                label="Used"
                value={`${Math.round(state.cashFlow.commitmentRatio * 100)}%`}
              />
            </MetricCardGrid>
          </Card>
        ) : null}

        {financialInsights.length > 0 ? (
          <FinancialInsightsSection insights={financialInsights} showViewAll={false} />
        ) : null}

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

        {state ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Upcoming commitments
            </p>
            <Card className="space-y-4">
              <MetricCardGrid>
                <MetricCard
                  label="This month burden"
                  value={formatInr(state.cashFlow.totalMonthlyCommitments)}
                />
                <MetricCard
                  label="Needs review"
                  value={String(needsReviewCount)}
                />
              </MetricCardGrid>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={AppRoute.COMMITMENTS}>Open Commitments</Link>
              </Button>
            </Card>
          </section>
        ) : null}

        {state ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Financial health
            </p>
            <Card className="space-y-3">
              <h2 className="font-display text-3xl tracking-[-0.04em] capitalize">
                {state.snapshot.healthStatus}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {state.snapshot.healthReason}
              </p>
              <MetricCardGrid>
                <MetricCard
                  label="Debt to income"
                  value={`${Math.round(state.snapshot.debtToIncomeRatio * 100)}%`}
                />
                <MetricCard
                  label="Buffer"
                  value={formatInr(state.cashFlow.emergencyBuffer, { compact: true })}
                />
              </MetricCardGrid>
            </Card>
          </section>
        ) : null}

        {priorityLoan ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              What if
            </p>
            <Card className="space-y-4">
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                Simulate payoff on {priorityLoan.name}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Explore extra payments without changing your live ledger.
              </p>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={`/loans/${priorityLoan.id}?strategy=monthly-extra`}>
                  Open simulator
                </Link>
              </Button>
            </Card>
          </section>
        ) : null}

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Future trends
          </p>
          <Card className="space-y-2">
            <h2 className="font-display text-3xl tracking-[-0.04em]">Coming later</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Longer-range cash-flow trends will appear here once more history is available.
            </p>
          </Card>
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
                <MetricCard
                  label="Commitments due soon"
                  value={String(weeklyReview.dueSoonCount)}
                />
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
    return `${formatInr(state.cashFlow.availableCash)} is available after commitments.`;
  }

  if (recommendation.category === "buffer") {
    return "Emergency buffer protects future payments.";
  }

  return "This can improve your next financial decision.";
}

function getRecommendationHref(recommendation: Recommendation, state: InsightsState) {
  if (recommendation.category === "debt") {
    const loan = getHighestInterestLoan(state.loans);
    return loan ? `/loans/${loan.id}` : AppRoute.PRODUCTS;
  }

  if (recommendation.category === "cash-flow" || recommendation.category === "buffer") {
    return AppRoute.COMMITMENTS;
  }

  if (recommendation.category === "due-date") {
    const due = getUrgentDue(state.upcomingDues);
    const relatedLoan = due ? state.loans.find((loan) => due.id.includes(loan.id)) : null;
    return relatedLoan ? `/loans/${relatedLoan.id}` : AppRoute.COMMITMENTS;
  }

  return AppRoute.HOME;
}

function getImpactLabel(recommendation: Recommendation, state: InsightsState) {
  if (recommendation.category === "debt") {
    const loan = getHighestInterestLoan(state.loans);
    return loan ? `Est. ${formatInr(estimateMonthlyInterest(loan))}/mo interest` : "Lower interest drag";
  }

  if (recommendation.category === "cash-flow") {
    return state.cashFlow.availableCash >= 0 ? "Decision room" : "Shortfall risk";
  }

  if (recommendation.category === "due-date") {
    const due = getUrgentDue(state.upcomingDues);
    return due ? formatInr(due.amount) : "Avoid penalty";
  }

  return "Better clarity";
}

function getWeeklyReview(state: InsightsState) {
  const financialCommitments = commitmentRecordsToFinancial(state.commitments);
  const dueSoonCount = financialCommitments.filter(
    (commitment) => commitment.status === "due-soon"
  ).length;

  return {
    title: "Your week in one sentence.",
    description:
      state.cashFlow.availableCash >= 0
        ? `You have room to decide, but ${dueSoonCount} upcoming commitment${dueSoonCount === 1 ? "" : "s"} should stay protected.`
        : "This week is tight. Focus on mandatory commitments before optional spending.",
    availableMoney: state.cashFlow.availableCash,
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
