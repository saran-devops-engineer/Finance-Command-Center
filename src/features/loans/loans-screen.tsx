"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
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

  if (isLoading) {
    return (
      <div className="space-y-8">
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
    <div className="space-y-8">
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Liabilities
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          Your loans
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Outstanding
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            {formatInr(totalOutstanding, { compact: true })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Monthly EMI
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            {formatInr(totalEmi, { compact: true })}
          </p>
        </Card>
      </div>

      <Button asChild className="w-full gap-2">
        <Link href="/loans/new">
          <Plus className="h-4 w-4" />
          Add loan
        </Link>
      </Button>

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Swipe portfolio
        </p>
        <div className="flex snap-y snap-mandatory flex-col gap-5 overflow-y-auto">
          {loans.length === 0 ? (
            <Card className="space-y-3 p-7">
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                No loans added yet.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Add your first loan from onboarding or the Home quick action to see a
                premium loan card here.
              </p>
            </Card>
          ) : null}

          {loans.map((loan) => {
            const paidPercent = Math.min(
              Math.round((loan.principalPaid / Math.max(loan.originalAmount, 1)) * 100),
              100
            );

            return (
              <Link key={loan.id} href={`/loans/${loan.id}`} className="block snap-center">
                <Card className="min-h-[24rem] space-y-6 p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {loan.type} loan · {loan.lender}
                      </p>
                      <h2 className="mt-2 font-display text-4xl leading-none tracking-[-0.05em]">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-white/45 p-4">
                      <p className="text-xs text-muted-foreground">Monthly EMI</p>
                      <p className="mt-1 font-semibold">{formatInr(loan.monthlyEmi)}</p>
                    </div>
                    <div className="rounded-3xl bg-white/45 p-4">
                      <p className="text-xs text-muted-foreground">Interest rate</p>
                      <p className="mt-1 font-semibold">{loan.annualInterestRate}% p.a.</p>
                    </div>
                    <div className="rounded-3xl bg-white/45 p-4">
                      <p className="text-xs text-muted-foreground">Tenure left</p>
                      <p className="mt-1 font-semibold">{loan.remainingTenureMonths} mo</p>
                    </div>
                    <div className="rounded-3xl bg-white/45 p-4">
                      <p className="text-xs text-muted-foreground">Next due</p>
                      <p className="mt-1 font-semibold">{loan.nextDueDate}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
