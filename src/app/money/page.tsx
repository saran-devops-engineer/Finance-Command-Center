"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import type { MoneyBreakdown } from "@/shared/domain/finance";
import {
  calculateAvailableMoney,
  calculateMandatoryCommitments
} from "@/services/financial-snapshot/available-money";

export default function MoneyPage() {
  const router = useRouter();
  const [moneyBreakdown, setMoneyBreakdown] = useState<MoneyBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMoney() {
      const [profile, localMoneyBreakdown] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getMoneyBreakdown()
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted || !localMoneyBreakdown) {
        router.replace("/onboarding");
        return;
      }

      setMoneyBreakdown(localMoneyBreakdown);
      setIsLoading(false);
    }

    void loadMoney();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const mandatoryCommitments = moneyBreakdown
    ? calculateMandatoryCommitments(moneyBreakdown)
    : 0;
  const availableMoney = moneyBreakdown ? calculateAvailableMoney(moneyBreakdown) : 0;
  const commitmentRatio = moneyBreakdown?.monthlyIncome
    ? mandatoryCommitments / moneyBreakdown.monthlyIncome
    : 0;
  const decisionCopy = moneyBreakdown
    ? getMoneyDecisionCopy({
        availableMoney,
        mandatoryCommitments
      })
    : null;
  const commitmentItems = moneyBreakdown ? getCommitmentItems(moneyBreakdown) : [];
  const allocation = getSuggestedAllocation(availableMoney);
  const emergencyTarget = mandatoryCommitments * 3;
  const emergencyGap = Math.max(emergencyTarget - (moneyBreakdown?.emergencyBuffer ?? 0), 0);

  if (isLoading) {
    return (
      <MobileShell>
        <div className="space-y-8">
          <header className="space-y-2 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Loading
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
              Reading your cash flow.
            </h1>
          </header>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="space-y-8">
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Cash flow
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            How much can you safely use?
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            A calm monthly view of income, commitments, and money left for decisions.
          </p>
        </header>

        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Safe to use
            </p>
            <p className="text-4xl font-semibold tracking-[-0.05em]">
              {formatInr(availableMoney)}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {decisionCopy}
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(commitmentRatio * 100, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <MiniMetric
              label="Income"
              value={formatInr(moneyBreakdown?.monthlyIncome ?? 0, { compact: true })}
            />
            <MiniMetric
              label="Committed"
              value={formatInr(mandatoryCommitments, { compact: true })}
            />
            <MiniMetric
              label="Used"
              value={`${Math.round(commitmentRatio * 100)}%`}
            />
          </div>
        </Card>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Commitment breakdown
          </p>
          <Card className="divide-y divide-border/70 p-0">
            {commitmentItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <p className="font-semibold">{formatInr(item.value)}</p>
              </div>
            ))}
          </Card>
        </section>

        {availableMoney > 0 ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Suggested allocation
            </p>
            <Card className="space-y-4 bg-primary text-primary-foreground">
              <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                Split available money before spending.
              </h2>
              <p className="text-sm leading-6 opacity-70">
                This is not a rule. It is a starting point to keep decisions balanced.
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <DarkMetric label="Save" value={formatInr(allocation.save)} />
                <DarkMetric label="Prepay" value={formatInr(allocation.prepay)} />
                <DarkMetric label="Flexible" value={formatInr(allocation.flexible)} />
              </div>
            </Card>
          </section>
        ) : null}

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Emergency buffer
          </p>
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl tracking-[-0.04em]">
                  {emergencyGap > 0 ? "Below target" : "Buffer looks steady"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Target is three months of mandatory commitments.
                </p>
              </div>
              <p className="text-right font-semibold">
                {formatInr(moneyBreakdown?.emergencyBuffer ?? 0)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MiniMetric label="Target" value={formatInr(emergencyTarget)} />
              <MiniMetric label="Gap" value={formatInr(emergencyGap)} />
            </div>
          </Card>
        </section>

        <Button asChild className="w-full">
          <Link href="/money/edit">Edit cash flow</Link>
        </Button>
      </div>
    </MobileShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/45 p-4">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4">
      <p className="opacity-60">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function getMoneyDecisionCopy(params: {
  availableMoney: number;
  mandatoryCommitments: number;
}) {
  if (params.availableMoney < 0) {
    return `You are short by ${formatInr(Math.abs(params.availableMoney))}. Cover mandatory commitments before flexible spending.`;
  }

  if (params.availableMoney === 0) {
    return "Your income is fully assigned to mandatory commitments this month.";
  }

  return `${formatInr(params.availableMoney)} remains after ${formatInr(params.mandatoryCommitments)} in mandatory commitments.`;
}

function getCommitmentItems(breakdown: MoneyBreakdown) {
  return [
    {
      label: "Loans and EMIs",
      description: "Loan payments and other EMIs",
      value: breakdown.loanPayments + breakdown.emis
    },
    {
      label: "Living commitments",
      description: "Rent, utilities, and mandatory expenses",
      value: breakdown.rent + breakdown.utilityBills + breakdown.mandatoryExpenses
    },
    {
      label: "Protection",
      description: "Insurance and fixed commitments",
      value: breakdown.insurance + breakdown.fixedCommitments
    }
  ];
}

function getSuggestedAllocation(availableMoney: number) {
  const safeAvailable = Math.max(availableMoney, 0);
  const save = Math.round(safeAvailable * 0.4);
  const prepay = Math.round(safeAvailable * 0.35);

  return {
    save,
    prepay,
    flexible: Math.max(safeAvailable - save - prepay, 0)
  };
}
