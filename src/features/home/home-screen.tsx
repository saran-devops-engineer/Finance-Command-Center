"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FinancialAmount } from "@/components/ui/financial-amount";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DynamicGreeting } from "@/components/ui/dynamic-greeting";
import { LoanProgressSummary } from "@/components/ui/loan-progress-summary";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { formatInr, cn } from "@/lib/utils";
import { card, spacing } from "@/lib/design-tokens";
import { financeRepository, buildHomeStateFromBootstrapCache } from "@/repositories";
import { generateFinancialInsights } from "@/engines/financial-insights";
import { FinancialInsightsSection } from "@/features/home/financial-insights-section";
import { UpcomingCommitmentsSection } from "@/features/home/upcoming-commitments-section";
import {
  getMeaningfulHealthMessage,
  getPriorityLoan
} from "@/features/home/home-helpers";
import { computeMonthlyInterestBurden } from "@/shared/finance/gold-loan-calculations";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  UserProfile
} from "@/shared/domain/finance";
import type { Chit } from "@/shared/domain/chit";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import { CommitmentReviewStatus } from "@/shared/domain/commitment-record";
import { getChitProviderDisplay, getPrizeStatusLabel } from "@/lib/chit-display";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";
import type { CashFlowSummary } from "@/services/cash-flow/calculate-cash-flow";
import {
  commitmentRecordsToFinancial,
  groupCommitmentRecordsAsFinancial
} from "@/services/cash-flow/commitment-record-bridge";
import { loadCommandCenterState } from "@/services/dashboard/load-command-center-state";
import { AppRoute } from "@/navigation";

const healthCopy = {
  healthy: "Healthy",
  attention: "Review today",
  critical: "Critical"
} as const;

interface HomeState {
  profile: UserProfile;
  loans: Loan[];
  chits: Chit[];
  commitments: CommitmentRecord[];
  moneyBreakdown: MoneyBreakdown;
  cashFlow: CashFlowSummary;
  snapshot: FinancialSnapshot;
  pinnedLoanId: string | null;
}

export function HomeScreen() {
  const router = useRouter();
  const initialBootstrapState = buildHomeStateFromBootstrapCache();
  const [state, setState] = useState<HomeState | null>(() =>
    initialBootstrapState
      ? {
          profile: initialBootstrapState.profile,
          loans: initialBootstrapState.loans,
          chits: [],
          commitments: [],
          moneyBreakdown: initialBootstrapState.moneyBreakdown,
          cashFlow: {
            totalMonthlyIncome: initialBootstrapState.moneyBreakdown.monthlyIncome,
            totalMonthlyCommitments: initialBootstrapState.snapshot.mandatoryCommitments,
            availableCash: initialBootstrapState.snapshot.availableMoney,
            emergencyBuffer: initialBootstrapState.moneyBreakdown.emergencyBuffer,
            commitmentRatio:
              initialBootstrapState.moneyBreakdown.monthlyIncome > 0
                ? initialBootstrapState.snapshot.mandatoryCommitments /
                  initialBootstrapState.moneyBreakdown.monthlyIncome
                : 0,
            incomeSourceCount: 1,
            commitmentCount: 0
          },
          snapshot: initialBootstrapState.snapshot,
          pinnedLoanId: initialBootstrapState.pinnedLoanId
        }
      : null
  );
  const [isLoading, setIsLoading] = useState(() => !initialBootstrapState);

  const loadSnapshot = useCallback(async () => {
    const next = await loadCommandCenterState(financeRepository);

    if (!next) {
      router.replace("/onboarding");
      return;
    }

    setState({
      profile: next.profile,
      loans: next.loans,
      chits: next.chits,
      commitments: next.commitments,
      moneyBreakdown: next.moneyBreakdown,
      cashFlow: next.cashFlow,
      snapshot: next.snapshot,
      pinnedLoanId: next.pinnedLoanId
    });
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const hasTrackedDashboardOpen = useRef(false);

  useEffect(() => {
    if (!isLoading && state && !hasTrackedDashboardOpen.current) {
      hasTrackedDashboardOpen.current = true;
      trackScreenViewed(ScreenName.HOME);
    }
  }, [isLoading, state]);

  useFinanceDataReload(() => {
    void loadSnapshot();
  });

  if (isLoading || !state) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Preparing your command center.
          </h1>
        </header>
        <Card>
          <p className="text-sm leading-6 text-muted-foreground">
            Reading your private on-device ledger.
          </p>
        </Card>
      </div>
    );
  }

  const { profile, loans, chits, commitments, moneyBreakdown, cashFlow, snapshot, pinnedLoanId } =
    state;
  const displayName = getDisplayName(profile);
  const healthMessage = getMeaningfulHealthMessage(snapshot, loans, moneyBreakdown);
  const financialCommitments = commitmentRecordsToFinancial(commitments);
  const commitmentGroups = groupCommitmentRecordsAsFinancial(commitments);
  const financialInsights = generateFinancialInsights({
    loans,
    chits,
    moneyBreakdown,
    commitments: financialCommitments
  });
  const priorityLoan = getPriorityLoan(loans, pinnedLoanId);
  const featuredChit = chits[0] ?? null;
  const needsReviewCount = commitments.filter(
    (item) => item.reviewStatus === CommitmentReviewStatus.NEEDS_REVIEW
  ).length;
  const isPriorityLoanPinned = Boolean(
    priorityLoan && pinnedLoanId && priorityLoan.id === pinnedLoanId
  );

  return (
    <div className={spacing.page}>
      <header className="pt-4">
        <DynamicGreeting name={displayName} />
      </header>

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Available Cash
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              <FinancialAmount amount={cashFlow.availableCash} />
            </p>
          </div>
          <div className="rounded-full border border-border px-3 py-1 text-xs font-medium">
            {healthCopy[snapshot.healthStatus]}
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {formatInr(cashFlow.totalMonthlyIncome)} income −{" "}
          {formatInr(cashFlow.totalMonthlyCommitments)} commitments
        </p>
        <p className="text-sm leading-6 text-muted-foreground">{healthMessage}</p>
      </Card>

      {needsReviewCount > 0 ? (
        <Card className={cn("space-y-3", card.paddingCompact)}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Needs attention
          </p>
          <h2 className="font-display text-2xl tracking-[-0.04em]">
            {needsReviewCount} commitment{needsReviewCount === 1 ? "" : "s"} need review
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Confirm migrated obligations so available cash stays accurate.
          </p>
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href={AppRoute.COMMITMENTS}>Review commitments</Link>
          </Button>
        </Card>
      ) : null}

      <div className={cn("grid grid-cols-2 gap-2", spacing.metricGrid)}>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href={AppRoute.PRODUCTS}>Products</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href={AppRoute.COMMITMENTS}>Commitments</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href={AppRoute.INSIGHTS}>Insights</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href={AppRoute.PROFILE}>Profile</Link>
        </Button>
      </div>

      <UpcomingCommitmentsSection groups={commitmentGroups} />

      <FinancialInsightsSection insights={financialInsights} />

      <section className={spacing.section}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Recent Products
          </p>
          <Link href={AppRoute.PRODUCTS} className="text-xs font-medium">
            View all
          </Link>
        </div>

        {priorityLoan ? (
          <Link href={`/loans/${priorityLoan.id}`} className="block">
            <Card className={cn("space-y-3", card.paddingCompact)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {priorityLoan.type} loan · {priorityLoan.lender}
                    </p>
                    {isPriorityLoanPinned ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        Pinned
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 font-display text-2xl tracking-[-0.04em]">
                    {priorityLoan.name}
                  </h3>
                </div>
                <p className="text-sm font-semibold">
                  <FinancialAmount amount={priorityLoan.outstandingBalance} />
                </p>
              </div>

              <LoanProgressSummary
                principalPaid={priorityLoan.principalPaid}
                originalAmount={priorityLoan.originalAmount}
              />

              <PrivacyMask as="p" className="text-xs text-muted-foreground">
                {priorityLoan.type === "gold"
                  ? `${priorityLoan.annualInterestRate}% p.a. · Interest ${formatInr(
                      Math.round(
                        computeMonthlyInterestBurden(
                          priorityLoan.outstandingBalance,
                          priorityLoan.annualInterestRate
                        )
                      )
                    )}/mo`
                  : `${priorityLoan.annualInterestRate}% p.a. · EMI ${formatInr(
                      priorityLoan.monthlyEmi
                    )}`}
              </PrivacyMask>
            </Card>
          </Link>
        ) : null}

        {featuredChit ? (
          <Link href={`/chits/${featuredChit.id}`} className="block">
            <Card className={cn("space-y-3", card.paddingCompact)}>
              {(() => {
                const metrics = deriveChitMetrics(featuredChit);

                return (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {getChitProviderDisplay(featuredChit)}
                        </p>
                        <h3 className="mt-1 font-display text-2xl tracking-[-0.04em]">
                          {featuredChit.chitName}
                        </h3>
                      </div>
                      <p className="text-sm font-semibold">
                        <FinancialAmount amount={featuredChit.monthlyContribution} />
                        /mo
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Current month</p>
                        <p className="font-semibold">Month {featuredChit.currentRunningMonth}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prize status</p>
                        <p className="font-semibold">{getPrizeStatusLabel(featuredChit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining months</p>
                        <p className="font-semibold">{metrics.remainingMonths}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next due</p>
                        <p className="font-semibold">{featuredChit.nextDueDate}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Card>
          </Link>
        ) : null}

        {!priorityLoan && !featuredChit ? (
          <Card className={cn("space-y-2", card.paddingCompact)}>
            <h3 className="font-display text-2xl tracking-[-0.04em]">No products yet.</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Add a loan or chit from Products when you are ready to track them here.
            </p>
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link href={AppRoute.PRODUCTS}>Open Products</Link>
            </Button>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function getDisplayName(profile: UserProfile) {
  const displayName = profile.displayName.trim();
  const normalizedName = displayName.toLowerCase();

  if (!displayName || normalizedName === "vikram" || normalizedName === "friend") {
    return "Arjun";
  }

  return displayName;
}
