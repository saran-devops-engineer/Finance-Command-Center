"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { formatInr, cn } from "@/lib/utils";
import { card, spacing } from "@/lib/design-tokens";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import type { Loan } from "@/shared/domain/finance";

export function LoansScreen() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLoans() {
      const [profile, localLoans] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.listLoans()
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      setLoans(localLoans);
      setIsLoading(false);
    }

    void loadLoans();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + loan.outstandingBalance,
    0
  );
  const totalEmi = loans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
  const estimatedMonthlyInterest = loans.reduce(
    (sum, loan) => sum + estimateMonthlyInterest(loan),
    0
  );
  const prioritizedLoans = [...loans].sort(compareLoanPriority);
  const priorityLoan = prioritizedLoans[0];
  const attentionMessage = priorityLoan ? getLoanAttentionMessage(priorityLoan) : null;

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading your loans.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Liabilities
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          Your loans
        </h1>
      </header>

      <MetricCardGrid columns={3}>
        <MetricCard
          label="Outstanding"
          value={formatInr(totalOutstanding, { compact: true })}
        />
        <MetricCard label="EMI" value={formatInr(totalEmi, { compact: true })} />
        <MetricCard
          label="Int./mo"
          value={formatInr(estimatedMonthlyInterest, { compact: true })}
        />
      </MetricCardGrid>

      {priorityLoan && attentionMessage ? (
        <Card className="space-y-3 bg-primary text-primary-foreground">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
                Needs attention
              </p>
              <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                {attentionMessage.title}
              </h2>
              <p className="text-sm leading-6 opacity-70">{attentionMessage.description}</p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/loans/${priorityLoan.id}`}>Review loan</Link>
          </Button>
        </Card>
      ) : null}

      <Button asChild className="w-full gap-2">
        <Link href="/loans/new">
          <Plus className="h-4 w-4" />
          Add loan
        </Link>
      </Button>

      <section className={spacing.section}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Priority portfolio
        </p>
        <div className={cn("flex flex-col", spacing.cardStack)}>
          {loans.length === 0 ? (
            <Card className={cn("space-y-2", card.paddingCompact)}>
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                No loans added yet.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Add your first loan from onboarding or the Home quick action to see a
                premium loan card here.
              </p>
            </Card>
          ) : null}

          {prioritizedLoans.map((loan) => {
            const paidPercent = Math.min(
              Math.round((loan.principalPaid / Math.max(loan.originalAmount, 1)) * 100),
              100
            );

            return (
              <Link key={loan.id} href={`/loans/${loan.id}`} className="block">
                <Card className={cn("space-y-4", card.paddingCompact)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {loan.type} loan · {loan.lender}
                      </p>
                      <h2 className="mt-1 font-display text-3xl leading-tight tracking-[-0.04em]">
                        {loan.name}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-semibold">{formatInr(loan.outstandingBalance)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {paidPercent}% principal paid
                    </p>
                  </div>

                  <MetricCardGrid>
                    <MetricCard label="EMI" value={formatInr(loan.monthlyEmi)} />
                    <MetricCard label="Rate" value={`${loan.annualInterestRate}% p.a.`} />
                    <MetricCard label="Tenure" value={`${loan.remainingTenureMonths} mo`} />
                    <MetricCard label="Next due" value={formatDueDate(loan.nextDueDate)} />
                  </MetricCardGrid>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function compareLoanPriority(first: Loan, second: Loan) {
  return getLoanPriorityScore(second) - getLoanPriorityScore(first);
}

function getLoanPriorityScore(loan: Loan) {
  const dueSoonBoost = getDaysUntil(loan.nextDueDate) <= 7 ? 600 : 0;
  const overdueBoost = loan.isOverdue ? 1_000 : 0;
  const goldLoanBoost = loan.type === "gold" ? 250 : 0;

  return overdueBoost + dueSoonBoost + goldLoanBoost + loan.annualInterestRate * 25;
}

function getLoanAttentionMessage(loan: Loan) {
  const daysUntilDue = getDaysUntil(loan.nextDueDate);

  if (loan.isOverdue) {
    return {
      title: `${loan.name} is overdue`,
      description: `Clear ${formatInr(loan.monthlyEmi)} first to reduce penalty risk and stress.`
    };
  }

  if (daysUntilDue === 1) {
    return {
      title: `${loan.name} EMI is due tomorrow`,
      description: `Keep ${formatInr(loan.monthlyEmi)} ready before using money elsewhere.`
    };
  }

  if (daysUntilDue >= 0 && daysUntilDue <= 7) {
    return {
      title: `${loan.name} EMI is due in ${daysUntilDue} days`,
      description: `This commitment should be protected before discretionary spending.`
    };
  }

  if (loan.type === "gold") {
    return {
      title: `${loan.name} may be dragging interest`,
      description: `At ${loan.annualInterestRate}% p.a., this is a strong candidate for prepayment.`
    };
  }

  return {
    title: `${loan.name} has the highest interest rate`,
    description: `At ${loan.annualInterestRate}% p.a., review whether a small prepayment helps.`
  };
}

function estimateMonthlyInterest(loan: Loan) {
  return Math.round(loan.outstandingBalance * (loan.annualInterestRate / 12 / 100));
}

function formatDueDate(date: string) {
  const daysUntilDue = getDaysUntil(date);

  if (daysUntilDue === 0) {
    return "Today";
  }

  if (daysUntilDue === 1) {
    return "Tomorrow";
  }

  if (daysUntilDue > 1 && daysUntilDue <= 7) {
    return `In ${daysUntilDue} days`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(`${date}T00:00:00`));
}

function getDaysUntil(date: string) {
  const targetDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000);
}
