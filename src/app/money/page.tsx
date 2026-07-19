"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { FinancialAmount } from "@/components/ui/financial-amount";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { spacing } from "@/lib/design-tokens";
import { formatInr } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import { loadCommandCenterState } from "@/services/dashboard/load-command-center-state";
import type { CashFlowSummary } from "@/services/cash-flow/calculate-cash-flow";
import { AppRoute } from "@/navigation";

export default function MoneyPage() {
  const router = useRouter();
  const [cashFlow, setCashFlow] = useState<CashFlowSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedScreenView = useRef(false);

  const loadMoney = useCallback(async () => {
    const next = await loadCommandCenterState(financeRepository);

    if (!next) {
      router.replace("/onboarding");
      return;
    }

    setCashFlow(next.cashFlow);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadMoney();
  }, [loadMoney]);

  useEffect(() => {
    if (!isLoading && cashFlow && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(ScreenName.MONEY);
    }
  }, [isLoading, cashFlow]);

  useFinanceDataReload(() => {
    void loadMoney();
  });

  const decisionCopy = cashFlow
    ? getMoneyDecisionCopy({
        availableMoney: cashFlow.availableCash,
        mandatoryCommitments: cashFlow.totalMonthlyCommitments
      })
    : null;
  const allocation = getSuggestedAllocation(cashFlow?.availableCash ?? 0);
  const emergencyTarget = (cashFlow?.totalMonthlyCommitments ?? 0) * 3;
  const emergencyGap = Math.max(emergencyTarget - (cashFlow?.emergencyBuffer ?? 0), 0);

  if (isLoading) {
    return (
      <MobileShell>
        <div className={spacing.page}>
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
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Cash flow
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            How much can you safely use?
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Calculated as income minus commitments. Edit obligations on Commitments;
            update income in Profile.
          </p>
        </header>

        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Available cash
            </p>
            <p className="text-4xl font-semibold tracking-[-0.05em]">
              <FinancialAmount amount={cashFlow?.availableCash ?? 0} />
            </p>
            <p className="text-sm leading-6 text-muted-foreground">{decisionCopy}</p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min((cashFlow?.commitmentRatio ?? 0) * 100, 100)}%`
              }}
            />
          </div>

          <MetricCardGrid columns={3}>
            <MetricCard
              label="Income"
              value={formatInr(cashFlow?.totalMonthlyIncome ?? 0, { compact: true })}
            />
            <MetricCard
              label="Committed"
              value={formatInr(cashFlow?.totalMonthlyCommitments ?? 0, { compact: true })}
            />
            <MetricCard
              label="Used"
              value={`${Math.round((cashFlow?.commitmentRatio ?? 0) * 100)}%`}
            />
          </MetricCardGrid>
        </Card>

        {(cashFlow?.availableCash ?? 0) > 0 ? (
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
              <MetricCardGrid columns={3}>
                <MetricCard label="Save" value={formatInr(allocation.save)} variant="dark" />
                <MetricCard label="Prepay" value={formatInr(allocation.prepay)} variant="dark" />
                <MetricCard label="Flexible" value={formatInr(allocation.flexible)} variant="dark" />
              </MetricCardGrid>
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
                {formatInr(cashFlow?.emergencyBuffer ?? 0)}
              </p>
            </div>
            <MetricCardGrid>
              <MetricCard label="Target" value={formatInr(emergencyTarget)} />
              <MetricCard label="Gap" value={formatInr(emergencyGap)} />
            </MetricCardGrid>
          </Card>
        </section>

        <div className="grid gap-2">
          <Button asChild className="w-full">
            <Link href={AppRoute.COMMITMENTS}>Manage commitments</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href={AppRoute.INSIGHTS}>View insights</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/profile/edit">Update income in Profile</Link>
          </Button>
        </div>
      </div>
    </MobileShell>
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
