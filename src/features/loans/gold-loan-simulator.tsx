"use client";

import { useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { cn, formatInr } from "@/lib/utils";
import { radius } from "@/lib/design-tokens";
import { simulateGoldPrincipalPayment } from "@/shared/finance/gold-loan-calculations";
import { toNumber } from "@/shared/finance/loan-form";
import type { Loan } from "@/shared/domain/finance";

interface GoldLoanSimulatorProps {
  loan: Loan;
}

export function GoldLoanSimulator({ loan }: GoldLoanSimulatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("50000");
  const [hasRun, setHasRun] = useState(false);

  const amount = toNumber(paymentAmount);

  const liveResult = useMemo(() => {
    if (amount <= 0) {
      return null;
    }

    return simulateGoldPrincipalPayment(loan, amount);
  }, [amount, loan]);

  const canRun = Boolean(liveResult?.valid);
  const result = hasRun && canRun ? liveResult : null;

  return (
    <ExpandableCard
      title="One-time Principal Payment"
      description="See how a one-time principal payment lowers your monthly interest burden."
      actionLabel="Simulate"
      icon={<Coins className="h-5 w-5" />}
      isExpanded={isExpanded}
      onExpandedChange={(next) => {
        setIsExpanded(next);
        if (!next) {
          setHasRun(false);
        }
      }}
    >
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Principal payment
        </span>
        <input
          value={paymentAmount}
          onChange={(event) => {
            setPaymentAmount(event.target.value);
            setHasRun(false);
          }}
          inputMode="numeric"
          placeholder="50000"
          className={cn(
            "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
            radius.input
          )}
        />
        <span className="block text-xs leading-5 text-muted-foreground">
          Outstanding principal: {formatInr(loan.outstandingBalance)}
        </span>
      </label>

      {liveResult && !liveResult.valid ? (
        <p className="text-sm text-destructive">{liveResult.error}</p>
      ) : null}

      <Button className="w-full" disabled={!canRun} onClick={() => setHasRun(true)}>
        Simulate payment
      </Button>

      {result ? <GoldPrincipalResult loan={loan} result={result} /> : null}
    </ExpandableCard>
  );
}

function GoldPrincipalResult({
  loan,
  result
}: {
  loan: Loan;
  result: NonNullable<ReturnType<typeof simulateGoldPrincipalPayment>>;
}) {
  return (
    <div className="space-y-4">
      <div className={cn("space-y-1 bg-primary/10 px-4 py-3", radius.inner)}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Monthly interest savings
        </p>
        <p className="font-display text-3xl leading-tight tracking-[-0.04em]">
          {formatInr(Math.round(result.monthlySavings))}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatInr(Math.round(result.yearlySavings))} saved every year
        </p>
      </div>

      <MetricCardGrid columns={2}>
        <MetricCard label="Current outstanding" value={formatInr(result.currentOutstanding)} />
        <MetricCard label="New outstanding" value={formatInr(result.newOutstanding)} />
        <MetricCard
          label="Current monthly interest"
          value={formatInr(Math.round(result.currentMonthlyInterest))}
        />
        <MetricCard
          label="New monthly interest"
          value={formatInr(Math.round(result.newMonthlyInterest))}
        />
      </MetricCardGrid>

      <div className={cn("space-y-2 bg-white/45 px-4 py-3 text-sm", radius.inner)}>
        <Row label="One-time payment" value={formatInr(result.paymentAmount)} />
        <Row
          label="Current annual interest"
          value={formatInr(Math.round(result.currentAnnualInterest))}
        />
        <Row
          label="New annual interest"
          value={formatInr(Math.round(result.newAnnualInterest))}
        />
        <Row
          label="Interest rate"
          value={`${loan.annualInterestRate}% p.a.`}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
