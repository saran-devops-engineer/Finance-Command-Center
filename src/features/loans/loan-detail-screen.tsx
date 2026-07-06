"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { simulatePrepayment } from "@/services/loan-projection/prepayment";
import type { Loan, LoanPayment } from "@/shared/domain/finance";

interface LoanDetailScreenProps {
  loanId: string;
}

export function LoanDetailScreen({ loanId }: LoanDetailScreenProps) {
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prepaymentAmount, setPrepaymentAmount] = useState("50000");

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

  const simulation = useMemo(() => {
    if (!loan) {
      return null;
    }

    return simulatePrepayment(loan, toNumber(prepaymentAmount));
  }, [loan, prepaymentAmount]);

  if (isLoading) {
    return (
      <div className="space-y-8">
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
      <div className="space-y-8">
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
    <div className="space-y-8">
      <header className="space-y-4 pt-4">
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Loans
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {loan.type} loan · {loan.lender}
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.05em]">
            {loan.name}
          </h1>
        </div>
      </header>

      <Card className="space-y-5">
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

      <section className="grid grid-cols-2 gap-3">
        <Metric label="Monthly EMI" value={formatInr(loan.monthlyEmi)} />
        <Metric label="Interest rate" value={`${loan.annualInterestRate}% p.a.`} />
        <Metric label="Tenure left" value={`${loan.remainingTenureMonths} mo`} />
        <Metric label="Next due" value={loan.nextDueDate} />
      </section>

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

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          What-if
        </p>
        <Card className="space-y-5 bg-primary text-primary-foreground">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
              Simulation
            </p>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
              Add an extra prepayment?
            </h2>
            <p className="text-sm leading-6 opacity-70">
              Estimate how a one-time part-payment could reduce tenure and interest.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
              Prepayment amount
            </span>
            <input
              value={prepaymentAmount}
              onChange={(event) => setPrepaymentAmount(event.target.value)}
              inputMode="numeric"
              className="h-12 w-full rounded-3xl border border-white/20 bg-white/10 px-4 text-base outline-none placeholder:text-white/45"
            />
          </label>

          {simulation ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="opacity-60">Interest saved</p>
                <p className="mt-1 font-semibold">
                  {formatInr(simulation.estimatedInterestSaved)}
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="opacity-60">Months saved</p>
                <p className="mt-1 font-semibold">{simulation.estimatedMonthsSaved}</p>
              </div>
            </div>
          ) : null}

          <Button variant="secondary" className="gap-2" type="button">
            <Calculator className="h-4 w-4" />
            See the math
          </Button>
          {simulation ? (
            <p className="text-xs leading-5 opacity-60">
              Estimate assumes the EMI stays the same and the prepayment directly reduces
              outstanding principal. Actual bank calculations can differ.
            </p>
          ) : null}
        </Card>
      </section>

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </Card>
  );
}

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
