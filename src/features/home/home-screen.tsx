"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import {
  homeLoanSimulationEngine,
  tryFromLoan
} from "@/services/home-loan-simulation";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";

const healthCopy = {
  healthy: "Healthy",
  attention: "Review today",
  critical: "Critical"
} as const;

type HomeLoan = Loan & {
  isPinned?: boolean;
  pinned?: boolean;
};

interface BestDecision {
  title: string;
  amountLabel: string;
  savedLabel: string;
  description: string;
  href: string;
}

export function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<{
    profile: UserProfile;
    loans: HomeLoan[];
    moneyBreakdown: MoneyBreakdown;
    snapshot: FinancialSnapshot;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSnapshot() {
      const [profile, moneyBreakdown, loans, upcomingDues] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getMoneyBreakdown(),
        indexedDbFinanceRepository.listLoans(),
        indexedDbFinanceRepository.listUpcomingDues()
      ]);

      if (!isMounted) {
        return;
      }

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
      setIsLoading(false);
    }

    void loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading || !state) {
    return (
      <div className="space-y-8">
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
  const primaryRecommendation = snapshot.recommendations[0];
  const displayName = getDisplayName(profile);
  const healthMessage = getMeaningfulHealthMessage(snapshot, loans, moneyBreakdown);
  const portfolioLoans = getPortfolioLoans(loans);
  const bestDecision = getTodaysBestDecision(snapshot, loans);

  return (
    <div className="space-y-8">
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Account statement
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          Good evening, {displayName}.
        </h1>
      </header>

      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-5">
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

        <p className="text-sm leading-6 text-muted-foreground">
          {formatInr(snapshot.availableMoney)} is safe to use after mandatory commitments
          like EMIs, insurance, rent, utilities, and fixed payments.
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-3xl bg-white/45 p-4">
            <p className="text-muted-foreground">Commitments</p>
            <p className="mt-1 font-semibold">{formatInr(snapshot.mandatoryCommitments)}</p>
          </div>
          <div className="rounded-3xl bg-white/45 p-4">
            <p className="text-muted-foreground">Debt ratio</p>
            <p className="mt-1 font-semibold">
              {Math.round(snapshot.debtToIncomeRatio * 100)}%
            </p>
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{healthMessage}</p>
      </Card>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <Button asChild className="shrink-0 gap-2">
          <Link href="/loans/new">
            <Plus className="h-4 w-4" />
            Loan
          </Link>
        </Button>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/money/edit">Edit cash flow</Link>
        </Button>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/money">Money</Link>
        </Button>
      </div>

      {bestDecision ? (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Today&apos;s best decision
          </p>
          <Card className="space-y-5 bg-primary text-primary-foreground">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
                Recommended action
              </p>
              <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                {bestDecision.title}
              </h2>
              <p className="text-sm leading-6 opacity-70">{bestDecision.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="opacity-60">Pay today</p>
                <p className="mt-1 font-semibold">{bestDecision.amountLabel}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="opacity-60">Estimated interest saved</p>
                <p className="mt-1 font-semibold">{bestDecision.savedLabel}</p>
              </div>
            </div>

            <Button asChild variant="secondary" size="sm" className="gap-2">
              <Link href={bestDecision.href}>
                See loan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </section>
      ) : null}

      {primaryRecommendation ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Insights for you
            </p>
            <Link href="/insights" className="text-xs font-medium">
              View all
            </Link>
          </div>
          <Card className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {primaryRecommendation.category.replace("-", " ")}
            </p>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
              {primaryRecommendation.title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {primaryRecommendation.description}
            </p>
            <Button size="sm" className="gap-2">
              {primaryRecommendation.actionLabel ?? "Review"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Upcoming dues
          </p>
          <p className="text-xs text-muted-foreground">March 2028</p>
        </div>
        <div className="space-y-3">
          {snapshot.upcomingDues.map((due) => (
            <Card key={due.id} className="flex items-center justify-between p-5">
              <div>
                <h3 className="font-semibold">{due.title}</h3>
                <p className="text-xs text-muted-foreground">{due.dueDate}</p>
              </div>
              <p className="font-semibold">{formatInr(due.amount)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Active portfolio
          </p>
          <Link href="/loans" className="text-xs text-muted-foreground">
            View All Loans
          </Link>
        </div>
        <div className="space-y-4">
          {loans.length === 0 ? (
            <Card className="space-y-3 p-5">
              <h3 className="font-display text-2xl tracking-[-0.04em]">
                No active loans yet.
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Add a loan when you are ready to see payoff progress and prepayment
                recommendations.
              </p>
            </Card>
          ) : null}

          {portfolioLoans.map((loan) => {
            const paidPercent = Math.min(
              Math.round((loan.principalPaid / Math.max(loan.originalAmount, 1)) * 100),
              100
            );

            return (
              <Link key={loan.id} href={`/loans/${loan.id}`} className="block">
                <Card className="space-y-3 p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {loan.type} loan · {loan.lender}
                      </p>
                      <h3 className="mt-1 font-display text-2xl tracking-[-0.04em]">
                        {loan.name}
                      </h3>
                    </div>
                    <p className="text-sm font-semibold">{formatInr(loan.outstandingBalance)}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {paidPercent}% principal paid · {loan.annualInterestRate}% p.a.
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
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

function getPortfolioLoans(loans: HomeLoan[]) {
  const pinnedLoans = loans.filter((loan) => loan.isPinned || loan.pinned);
  const sourceLoans = pinnedLoans.length > 0 ? pinnedLoans : [...loans].sort(compareLoanPriority);

  return sourceLoans.slice(0, 3);
}

function compareLoanPriority(first: HomeLoan, second: HomeLoan) {
  const firstScore = getLoanPriorityScore(first);
  const secondScore = getLoanPriorityScore(second);

  return secondScore - firstScore;
}

function getLoanPriorityScore(loan: HomeLoan) {
  const dueSoonBoost = getDaysUntil(loan.nextDueDate) <= 7 ? 500 : 0;
  const overdueBoost = loan.isOverdue ? 1000 : 0;
  const goldLoanBoost = loan.type === "gold" ? 250 : 0;

  return overdueBoost + dueSoonBoost + goldLoanBoost + loan.annualInterestRate * 20;
}

function getMeaningfulHealthMessage(
  snapshot: FinancialSnapshot,
  loans: HomeLoan[],
  moneyBreakdown: MoneyBreakdown
) {
  const urgentDue = getMostUrgentDue(snapshot.upcomingDues);
  const highestInterestLoan = getHighestInterestLoan(loans);
  const emergencyTarget = snapshot.mandatoryCommitments * 3;

  if (snapshot.availableMoney < 0) {
    return "Mandatory commitments exceed this month's income. Cover dues before discretionary spending.";
  }

  if (urgentDue) {
    const daysUntilDue = getDaysUntil(urgentDue.dueDate);
    if (daysUntilDue === 1) {
      return `${urgentDue.title} is due tomorrow. Keep ${formatInr(urgentDue.amount)} ready.`;
    }

    if (daysUntilDue <= 7) {
      return `${urgentDue.title} is due in ${daysUntilDue} days. Plan this before using available money.`;
    }
  }

  if (moneyBreakdown.emergencyBuffer < emergencyTarget) {
    return `Emergency fund is below the suggested target of ${formatInr(emergencyTarget)}.`;
  }

  if (highestInterestLoan) {
    return `${highestInterestLoan.name} is generating the highest interest at ${highestInterestLoan.annualInterestRate}% p.a.`;
  }

  return snapshot.healthReason;
}

function getTodaysBestDecision(
  snapshot: FinancialSnapshot,
  loans: HomeLoan[]
): BestDecision | null {
  const targetLoan = getHighestInterestLoan(loans);

  if (!targetLoan || snapshot.availableMoney <= 0) {
    return null;
  }

  const suggestedAmount = Math.min(
    Math.max(Math.floor(snapshot.availableMoney * 0.35 / 1000) * 1000, 5000),
    20000,
    targetLoan.outstandingBalance
  );
  const estimatedInterestSaved = estimateInterestSaved(targetLoan, suggestedAmount);

  return {
    title: `Pay ${formatInr(suggestedAmount)} toward ${targetLoan.name}`,
    amountLabel: formatInr(suggestedAmount),
    savedLabel: formatInr(estimatedInterestSaved),
    description: "This keeps the action small, useful, and focused on reducing expensive debt.",
    href: `/loans/${targetLoan.id}`
  };
}

function getHighestInterestLoan(loans: HomeLoan[]) {
  return [...loans].sort(
    (first, second) => second.annualInterestRate - first.annualInterestRate
  )[0];
}

function estimateInterestSaved(loan: HomeLoan, amount: number) {
  const homeLoanInput = tryFromLoan(loan);

  if (homeLoanInput) {
    const result = homeLoanSimulationEngine.simulate(homeLoanInput, {
      kind: "prepay-reduce-tenure",
      prepaymentAmount: amount
    });

    return result.outcome.interestSaved;
  }

  const yearsRemaining = Math.max(loan.remainingTenureMonths / 12, 0.5);
  return Math.round(amount * (loan.annualInterestRate / 100) * Math.min(yearsRemaining, 5));
}

function getMostUrgentDue(upcomingDues: UpcomingDue[]) {
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
