"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { spacing } from "@/lib/design-tokens";
import { formatInr } from "@/lib/utils";
import { getPinnedLoanId, setPinnedLoanId } from "@/lib/pinned-loan";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { WhatIfSimulator } from "@/features/loans/what-if-simulator";
import type { Loan, LoanPayment } from "@/shared/domain/finance";

interface LoanDetailScreenProps {
  loanId: string;
}

export function LoanDetailScreen({ loanId }: LoanDetailScreenProps) {
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLoan() {
      const [profile, localLoan, localPayments] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getLoan(loanId),
        indexedDbFinanceRepository.listLoanPayments(loanId)
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      setLoan(localLoan);
      setPayments(localPayments);
      setIsPinned(getPinnedLoanId() === loanId);
      setIsLoading(false);
    }

    void loadLoan();

    return () => {
      isMounted = false;
    };
  }, [loanId, router]);

  const paidPercent = loan
    ? Math.min(Math.round((loan.principalPaid / Math.max(loan.originalAmount, 1)) * 100), 100)
    : 0;
  const interestShare = loan
    ? Math.round((loan.interestPaid / Math.max(loan.interestPaid + loan.principalPaid, 1)) * 100)
    : 0;
  const principalShare = 100 - interestShare;

  const attentionMessage = loan ? getLoanDetailAttention(loan) : null;

  function togglePinnedLoan() {
    if (!loan) {
      return;
    }

    const nextPinned = !isPinned;
    setPinnedLoanId(nextPinned ? loan.id : null);
    setIsPinned(nextPinned);
  }

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading loan details.
          </h1>
        </header>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className={spacing.page}>
        <header className="space-y-4 pt-4">
          <Link
            href="/loans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Loans
          </Link>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Loan not found.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Loans
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {loan.type} loan · {loan.lender}
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.05em]">
              {loan.name}
            </h1>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={togglePinnedLoan}
            aria-pressed={isPinned}
          >
            <Star
              className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`}
              strokeWidth={1.8}
            />
            {isPinned ? "Pinned" : "Pin"}
          </Button>
        </div>
      </header>

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Outstanding
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
            {formatInr(loan.outstandingBalance)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${paidPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>{paidPercent}% principal paid</span>
            <span>{formatInr(loan.principalPaid)} of {formatInr(loan.originalAmount)}</span>
          </div>
        </div>
      </Card>

      {attentionMessage ? (
        <Card className="space-y-3">
          <div className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/55">
              <Info className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Decision note
              </p>
              <h2 className="mt-1 font-display text-2xl tracking-[-0.04em]">
                {attentionMessage.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {attentionMessage.description}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <MetricCardGrid>
        <MetricCard label="EMI" value={formatInr(loan.monthlyEmi)} />
        <MetricCard label="Rate" value={`${loan.annualInterestRate}% p.a.`} />
        <MetricCard label="Tenure" value={`${loan.remainingTenureMonths} mo`} />
        <MetricCard label="Next due" value={formatDueDate(loan.nextDueDate)} />
      </MetricCardGrid>

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Paid so far
        </p>
        <Card className="divide-y divide-border/70 p-0">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold">Interest paid</p>
              <p className="text-xs text-muted-foreground">{interestShare}% of tracked repayment</p>
            </div>
            <p className="font-semibold">{formatInr(loan.interestPaid)}</p>
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold">Principal reduced</p>
              <p className="text-xs text-muted-foreground">{principalShare}% of tracked repayment</p>
            </div>
            <p className="font-semibold">{formatInr(loan.principalPaid)}</p>
          </div>
        </Card>
      </section>

      <Button asChild className="w-full">
        <Link href={`/loans/${loan.id}/payment`}>Log payment</Link>
      </Button>

      <WhatIfSimulator loan={loan} />

      {payments.length > 0 ? (
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Recent payments
          </p>
          <Card className="divide-y divide-border/70 p-0">
            {payments
              .slice()
              .sort((first, second) => second.paidOn.localeCompare(first.paidOn))
              .slice(0, 4)
              .map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold capitalize">
                      {payment.kind.replace("-", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{payment.paidOn}</p>
                  </div>
                  <p className="font-semibold">{formatInr(payment.amount)}</p>
                </div>
              ))}
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function getLoanDetailAttention(loan: Loan) {
  const daysUntilDue = getDaysUntil(loan.nextDueDate);
  const monthlyInterest = Math.round(loan.outstandingBalance * (loan.annualInterestRate / 12 / 100));

  if (loan.isOverdue) {
    return {
      title: "This loan is overdue",
      description: `Prioritize the missed EMI before making optional prepayments.`
    };
  }

  if (daysUntilDue === 1) {
    return {
      title: "EMI due tomorrow",
      description: `Keep ${formatInr(loan.monthlyEmi)} ready so this payment does not become a penalty risk.`
    };
  }

  if (loan.annualInterestRate >= 12) {
    return {
      title: "High-interest loan",
      description: `This loan is estimated to cost about ${formatInr(monthlyInterest)} in interest this month.`
    };
  }

  return {
    title: "Track this loan steadily",
    description: "Regular payments and occasional prepayment simulations will show whether closing early is worth it."
  };
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
