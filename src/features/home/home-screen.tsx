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
import type { FinancialSnapshot, Loan, UserProfile } from "@/shared/domain/finance";

const healthCopy = {
  healthy: "Healthy",
  attention: "Attention needed",
  critical: "Critical"
} as const;

export function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<{
    profile: UserProfile;
    loans: Loan[];
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

  const { profile, loans, snapshot } = state;
  const primaryRecommendation = snapshot.recommendations[0];

  return (
    <div className="space-y-8">
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Account statement
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          Good evening, {profile.displayName}.
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

        <p className="text-sm leading-6 text-muted-foreground">{snapshot.healthReason}</p>
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
            All loans
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

          {loans.slice(0, 3).map((loan) => {
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
                  <div className="h-full rounded-full bg-primary" style={{ width: `${paidPercent}%` }} />
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
