"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DynamicGreeting } from "@/components/ui/dynamic-greeting";
import { LoanProgressSummary } from "@/components/ui/loan-progress-summary";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { formatInr, cn } from "@/lib/utils";
import { card, spacing } from "@/lib/design-tokens";
import { getPinnedLoanId } from "@/lib/pinned-loan";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import {
  formatDueLabel,
  getGoldRenewalAlert,
  getHomeDueDisplay,
  getMeaningfulHealthMessage,
  getPrimaryRecommendation,
  getPriorityLoan,
  getRecommendationHref,
  HOME_DUE_LOOKAHEAD_DAYS
} from "@/features/home/home-helpers";
import { computeMonthlyInterestBurden } from "@/shared/finance/gold-loan-calculations";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  UserProfile
} from "@/shared/domain/finance";

const healthCopy = {
  healthy: "Healthy",
  attention: "Review today",
  critical: "Critical"
} as const;

export function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<{
    profile: UserProfile;
    loans: Loan[];
    moneyBreakdown: MoneyBreakdown;
    snapshot: FinancialSnapshot;
  } | null>(null);
  const [pinnedLoanId, setPinnedLoanIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSnapshot = useCallback(async () => {
    const [profile, moneyBreakdown, loans, upcomingDues] = await Promise.all([
      indexedDbFinanceRepository.getProfile(),
      indexedDbFinanceRepository.getMoneyBreakdown(),
      indexedDbFinanceRepository.listLoans(),
      indexedDbFinanceRepository.listUpcomingDues()
    ]);

    if (!profile?.onboardingCompleted || !moneyBreakdown) {
      router.replace("/onboarding");
      return;
    }

    setState({
      profile,
      loans,
      moneyBreakdown,
      snapshot: createFinancialSnapshot({
        money: moneyBreakdown,
        loans,
        upcomingDues
      })
    });
    setPinnedLoanIdState(getPinnedLoanId());
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
      setPinnedLoanIdState(getPinnedLoanId());
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

  const { profile, loans, moneyBreakdown, snapshot } = state;
  const displayName = getDisplayName(profile);
  const healthMessage = getMeaningfulHealthMessage(snapshot, loans, moneyBreakdown);
  const dueDisplay = getHomeDueDisplay(snapshot.upcomingDues);
  const goldRenewalAlert = getGoldRenewalAlert(loans);
  const priorityLoan = getPriorityLoan(loans, pinnedLoanId);
  const primaryRecommendation = getPrimaryRecommendation(snapshot.recommendations);
  const recommendationHref = primaryRecommendation
    ? getRecommendationHref(primaryRecommendation, loans, snapshot.upcomingDues)
    : null;
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
              Available money
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

      <div className={cn("grid grid-cols-3", spacing.metricGrid)}>
        <Button asChild variant="secondary" size="sm" className="gap-1 px-2 text-xs">
          <Link href="/loans/new">
            <Plus className="h-4 w-4 shrink-0" />
            Add Loan
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href="/money/edit">Add Income</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="px-2 text-xs">
          <Link href="/money/edit">Add Expense</Link>
        </Button>
      </div>

      <section className={spacing.section}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {dueDisplay.status === "overdue" ? "Overdue" : "Upcoming due"}
          </p>
          {dueDisplay.status !== "clear" && dueDisplay.hasMore ? (
            <Link href="/loans" className="text-xs font-medium">
              View all
            </Link>
          ) : null}
        </div>

        {dueDisplay.status === "clear" ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No payments due in the next {HOME_DUE_LOOKAHEAD_DAYS} days.
          </p>
        ) : (
          <Card className={cn("flex items-center justify-between gap-4", card.paddingCompact)}>
            <div>
              <h3 className="font-semibold">{dueDisplay.featuredDue.title}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDueLabel(dueDisplay.featuredDue.dueDate)}
              </p>
            </div>
            <p className="font-semibold">{formatInr(dueDisplay.featuredDue.amount)}</p>
          </Card>
        )}
      </section>

      {goldRenewalAlert ? (
        <section className={spacing.section}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Gold loan renewal due
          </p>
          <Link href={`/loans/${goldRenewalAlert.loan.id}`} className="block">
            <Card className={cn("flex items-center justify-between gap-4", card.paddingCompact)}>
              <div className="min-w-0">
                <h3 className="font-semibold">{goldRenewalAlert.loan.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {goldRenewalAlert.isOverdue
                    ? `Renewal overdue by ${Math.abs(goldRenewalAlert.daysRemaining)} day${
                        Math.abs(goldRenewalAlert.daysRemaining) === 1 ? "" : "s"
                      }`
                    : goldRenewalAlert.daysRemaining === 0
                      ? "Renewal due today"
                      : `Renewal in ${goldRenewalAlert.daysRemaining} day${
                          goldRenewalAlert.daysRemaining === 1 ? "" : "s"
                        }`}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        </section>
      ) : null}

      <section className={spacing.section}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Priority loan
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

      {primaryRecommendation && recommendationHref ? (
        <section className={spacing.section}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              What to do next
            </p>
            <Link href="/insights" className="text-xs font-medium">
              View all
            </Link>
          </div>
          <Card className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {primaryRecommendation.category.replace("-", " ")}
            </p>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
              {primaryRecommendation.title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {primaryRecommendation.description}
            </p>
            <Button asChild size="sm" className="gap-2">
              <Link href={recommendationHref}>
                {primaryRecommendation.actionLabel ?? "Review"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </section>
      ) : null}
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
