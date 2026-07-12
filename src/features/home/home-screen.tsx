"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DynamicGreeting } from "@/components/ui/dynamic-greeting";
import { LoanProgressSummary } from "@/components/ui/loan-progress-summary";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { formatInr, cn } from "@/lib/utils";
import { card, spacing } from "@/lib/design-tokens";
import { getPinnedLoanId } from "@/lib/pinned-loan";
import { financeRepository, buildHomeStateFromBootstrapCache } from "@/repositories";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import { buildFinancialCommitments, groupFinancialCommitments } from "@/engines/commitment";
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
import { getChitProviderDisplay, getPrizeStatusLabel } from "@/lib/chit-display";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";

const healthCopy = {
  healthy: "Healthy",
  attention: "Review today",
  critical: "Critical"
} as const;

export function HomeScreen() {
  const router = useRouter();
  const initialBootstrapState = buildHomeStateFromBootstrapCache();
  const [state, setState] = useState<{
    profile: UserProfile;
    loans: Loan[];
    chits: Chit[];
    moneyBreakdown: MoneyBreakdown;
    snapshot: FinancialSnapshot;
  } | null>(() =>
    initialBootstrapState
      ? {
          profile: initialBootstrapState.profile,
          loans: initialBootstrapState.loans,
          chits: [],
          moneyBreakdown: initialBootstrapState.moneyBreakdown,
          snapshot: initialBootstrapState.snapshot
        }
      : null
  );
  const [pinnedLoanId, setPinnedLoanIdState] = useState<string | null>(
    () => initialBootstrapState?.pinnedLoanId ?? null
  );
  const [isLoading, setIsLoading] = useState(() => !initialBootstrapState);

  const loadSnapshot = useCallback(async () => {
    const [profile, moneyBreakdown, loans, chits, upcomingDues, settings] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.getMoneyBreakdown(),
      financeRepository.listLoans(),
      financeRepository.listChits(),
      financeRepository.listUpcomingDues(),
      financeRepository.getSettings()
    ]);

    if (!profile?.onboardingCompleted || !moneyBreakdown) {
      router.replace("/onboarding");
      return;
    }

    setState({
      profile,
      loans,
      chits,
      moneyBreakdown,
      snapshot: createFinancialSnapshot({
        money: moneyBreakdown,
        loans,
        upcomingDues
      })
    });
    setPinnedLoanIdState(settings.pinnedLoanId);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useFinanceDataReload(() => {
    void loadSnapshot();
  });

  useEffect(() => {
    function syncPinnedLoan() {
      void getPinnedLoanId().then(setPinnedLoanIdState);
    }

    window.addEventListener("focus", syncPinnedLoan);

    return () => {
      window.removeEventListener("focus", syncPinnedLoan);
    };
  }, []);

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

  const { profile, loans, chits, moneyBreakdown, snapshot } = state;
  const displayName = getDisplayName(profile);
  const healthMessage = getMeaningfulHealthMessage(snapshot, loans, moneyBreakdown);
  const commitments = buildFinancialCommitments({ loans, chits });
  const commitmentGroups = groupFinancialCommitments(commitments);
  const financialInsights = generateFinancialInsights({
    loans,
    chits,
    moneyBreakdown,
    commitments
  });
  const priorityLoan = getPriorityLoan(loans, pinnedLoanId);
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
              Financial Health
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              {formatInr(snapshot.availableMoney)}
            </p>
          </div>
          <div className="rounded-full border border-border px-3 py-1 text-xs font-medium">
            {healthCopy[snapshot.healthStatus]}
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{healthMessage}</p>
      </Card>

      <div className={cn("grid grid-cols-2 gap-2", spacing.metricGrid)}>
        <Button asChild variant="secondary" size="sm" className="gap-1 px-2 text-xs">
          <Link href="/loans/new">
            <Plus className="h-4 w-4 shrink-0" />
            Add Loan
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="gap-1 px-2 text-xs">
          <Link href="/chits/new">
            <Plus className="h-4 w-4 shrink-0" />
            Add Chit
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href="/money/edit">Add Income</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href="/money/edit">Add Expense</Link>
        </Button>
      </div>

      <UpcomingCommitmentsSection groups={commitmentGroups} />

      <FinancialInsightsSection insights={financialInsights} />

      <section className={spacing.section}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Active Loans
          </p>
          <Link href="/loans" className="text-xs font-medium">
            View all loans
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
                  {formatInr(priorityLoan.outstandingBalance)}
                </p>
              </div>

              <LoanProgressSummary
                principalPaid={priorityLoan.principalPaid}
                originalAmount={priorityLoan.originalAmount}
              />

              <p className="text-xs text-muted-foreground">
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
              </p>
            </Card>
          </Link>
        ) : (
          <Card className={cn("space-y-2", card.paddingCompact)}>
            <h3 className="font-display text-2xl tracking-[-0.04em]">No active loans yet.</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Add a loan when you are ready to track payoff progress here.
            </p>
          </Card>
        )}
      </section>

      <section className={spacing.section}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Your Chits
          </p>
          <Link href="/chits" className="text-xs font-medium">
            View all chits
          </Link>
        </div>

        {chits.length === 0 ? (
          <Card className={cn("space-y-2", card.paddingCompact)}>
            <h3 className="font-display text-2xl tracking-[-0.04em]">No active chits yet.</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Add a chit to track monthly contributions and prize status.
            </p>
          </Card>
        ) : (
          <Link href={`/chits/${chits[0]?.id}`} className="block">
            <Card className={cn("space-y-3", card.paddingCompact)}>
              {(() => {
                const featuredChit = chits[0]!;
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
                        {formatInr(featuredChit.monthlyContribution)}/mo
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
        )}
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
