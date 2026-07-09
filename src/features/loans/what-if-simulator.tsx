"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { cn, formatInr } from "@/lib/utils";
import { card, radius } from "@/lib/design-tokens";
import {
  homeLoanSimulationEngine,
  simulateLoanPrepayment,
  simulateMonthlyExtra,
  tryFromLoan
} from "@/services/home-loan-simulation";
import type { LoanPrepaymentStrategy } from "@/services/home-loan-simulation/presenters/loan-prepayment";
import type { MonthlyExtraSimulationView } from "@/services/home-loan-simulation";
import type {
  HomeLoanCompareResult,
  HomeLoanSimulationResult
} from "@/services/home-loan-simulation";
import type { AmortizationScheduleRow } from "@/engines/loan/home-loan/core/types";
import type { Loan } from "@/shared/domain/finance";

type SimulatorStrategy =
  | "one-time"
  | "monthly-extra"
  | "annual-prepayment"
  | "increase-emi"
  | "target-closure"
  | "compare";

interface WhatIfSimulatorProps {
  loan: Loan;
}

const simulatorStrategies: Array<{
  id: SimulatorStrategy;
  title: string;
  description: string;
  isAvailable: boolean;
}> = [
  {
    id: "one-time",
    title: "One-time Extra Payment",
    description: "Try one extra principal payment before you act.",
    isAvailable: true
  },
  {
    id: "monthly-extra",
    title: "Monthly Extra Payment",
    description: "Pay an additional amount every month to close your loan earlier.",
    isAvailable: true
  },
  {
    id: "annual-prepayment",
    title: "Annual Prepayment",
    description: "Plan a yearly lump-sum payment.",
    isAvailable: false
  },
  {
    id: "increase-emi",
    title: "Increase EMI",
    description: "See the impact of paying more every month.",
    isAvailable: false
  },
  {
    id: "target-closure",
    title: "Target Loan Closure",
    description: "Work backward from a closure goal.",
    isAvailable: false
  },
  {
    id: "compare",
    title: "Compare Strategies",
    description: "Compare tenure reduction with EMI reduction.",
    isAvailable: true
  }
];

export function WhatIfSimulator({ loan }: WhatIfSimulatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<SimulatorStrategy | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState("100000");
  const [monthlyExtraAmount, setMonthlyExtraAmount] = useState("5000");
  const [goal, setGoal] = useState<LoanPrepaymentStrategy>("reduce-tenure");
  const [hasRunSimulation, setHasRunSimulation] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showFullCalculation, setShowFullCalculation] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const amount = toNumber(prepaymentAmount);
  const monthlyExtraValue = toNumber(monthlyExtraAmount);
  const homeLoanInput = useMemo(() => tryFromLoan(loan), [loan]);

  const monthlyExtraView = useMemo(() => {
    if (expandedStrategy !== "monthly-extra" || monthlyExtraValue <= 0) {
      return null;
    }

    return simulateMonthlyExtra(loan, monthlyExtraValue);
  }, [expandedStrategy, loan, monthlyExtraValue]);
  const selectedResult = useMemo(() => {
    if (!hasRunSimulation || !expandedStrategy || !amount) {
      return null;
    }

    const activeGoal = expandedStrategy === "compare" ? "reduce-tenure" : goal;
    return simulateLoanPrepayment(loan, amount, activeGoal);
  }, [amount, goal, hasRunSimulation, loan, expandedStrategy]);

  const engineResult = selectedResult?.engineResult ?? null;

  const compareResult = useMemo(() => {
    if (!hasRunSimulation || expandedStrategy !== "compare" || !homeLoanInput || !amount) {
      return null;
    }

    return homeLoanSimulationEngine.comparePrepayment(homeLoanInput, amount);
  }, [amount, hasRunSimulation, homeLoanInput, expandedStrategy]);

  function resetRunState() {
    setHasRunSimulation(false);
    setShowComparison(false);
    setShowFullCalculation(false);
    setShowSchedule(false);
  }

  function handleExpandedChange(nextValue: boolean) {
    setIsExpanded(nextValue);

    if (!nextValue) {
      resetRunState();
    }
  }

  function handleToggleStrategy(strategy: SimulatorStrategy) {
    if (expandedStrategy === strategy) {
      // Collapse the open card. User-entered values are kept in state so the
      // card reopens exactly as they left it.
      setExpandedStrategy(null);
      return;
    }

    // Opening a different strategy closes the previous one and starts fresh.
    setExpandedStrategy(strategy);
    resetRunState();
  }

  function handleAmountChange(nextValue: string) {
    setPrepaymentAmount(nextValue);
    resetRunState();
  }

  function handleGoalChange(nextGoal: LoanPrepaymentStrategy) {
    setGoal(nextGoal);
    setHasRunSimulation(false);
  }

  function handleRunSimulation() {
    setHasRunSimulation(true);
    setShowComparison(expandedStrategy === "compare");
    setShowFullCalculation(false);
    setShowSchedule(false);
  }

  function handleMonthlyExtraChange(nextValue: string) {
    setMonthlyExtraAmount(nextValue);
    resetRunState();
  }

  return (
    <section className="space-y-4">
      <ExpandableCard
        title="What-if Simulator"
        description="Explore different repayment strategies before making a financial decision. Nothing changes in your actual loan until you decide to act."
        actionLabel="Explore"
        icon={<Sparkles className="h-5 w-5" strokeWidth={1.8} />}
        isExpanded={isExpanded}
        onExpandedChange={handleExpandedChange}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Step 1
            </p>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
              Choose a repayment strategy.
            </h2>
          </div>

          <div className="space-y-3">
            {simulatorStrategies.map((strategy) => {
              const isOpen = expandedStrategy === strategy.id;

              return (
                <StrategyAccordionCard
                  key={strategy.id}
                  strategy={strategy}
                  isOpen={isOpen}
                  onToggle={() => handleToggleStrategy(strategy.id)}
                >
                  {!strategy.isAvailable ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      This strategy needs additional loan details and will be added later. Use
                      one-time extra payment, monthly extra payment, or compare strategies for
                      now.
                    </p>
                  ) : strategy.id === "monthly-extra" ? (
                    <MonthlyExtraStrategyBody
                      amount={monthlyExtraAmount}
                      view={monthlyExtraView}
                      hasRun={isOpen && hasRunSimulation}
                      showSchedule={showSchedule}
                      onAmountChange={handleMonthlyExtraChange}
                      onRun={handleRunSimulation}
                      onToggleSchedule={() => setShowSchedule((current) => !current)}
                    />
                  ) : (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Amount
                        </span>
                        <input
                          value={prepaymentAmount}
                          onChange={(event) => handleAmountChange(event.target.value)}
                          inputMode="numeric"
                          className={cn(
                            "h-12 w-full border border-border bg-card/80 px-4 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-primary/35",
                            radius.input
                          )}
                        />
                      </label>

                      {strategy.id === "one-time" ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Goal
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <StrategyGoalButton
                              label="Reduce Tenure"
                              description="Same EMI, close sooner"
                              isSelected={goal === "reduce-tenure"}
                              onClick={() => handleGoalChange("reduce-tenure")}
                            />
                            <StrategyGoalButton
                              label="Reduce EMI"
                              description="Lower monthly EMI"
                              isSelected={goal === "reduce-emi"}
                              onClick={() => handleGoalChange("reduce-emi")}
                            />
                          </div>
                        </div>
                      ) : null}

                      <Button
                        type="button"
                        className="w-full"
                        onClick={handleRunSimulation}
                        disabled={amount <= 0}
                      >
                        Run Simulation
                      </Button>

                      {isOpen && selectedResult ? (
                        <RecommendationCard
                          loan={loan}
                          result={selectedResult}
                          selectedStrategy={strategy.id}
                          engineResult={engineResult}
                          compareResult={compareResult}
                          showComparison={showComparison}
                          showFullCalculation={showFullCalculation}
                          onShowComparison={() => setShowComparison((current) => !current)}
                          onShowFullCalculation={() =>
                            setShowFullCalculation((current) => !current)
                          }
                        />
                      ) : null}
                    </>
                  )}
                </StrategyAccordionCard>
              );
            })}
          </div>
        </div>
      </ExpandableCard>
    </section>
  );
}

function StrategyAccordionCard({
  strategy,
  isOpen,
  onToggle,
  children
}: {
  strategy: (typeof simulatorStrategies)[number];
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        radius.inner,
        "overflow-hidden border transition-colors duration-200 motion-reduce:transition-none",
        isOpen ? "border-primary/45 bg-card shadow-card" : "border-border bg-card/70"
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left outline-none transition hover:bg-card focus-visible:ring-2 focus-visible:ring-primary/35 motion-reduce:transition-none"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{strategy.title}</span>
            {!strategy.isAvailable ? (
              <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Planned
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            {strategy.description}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out motion-reduce:transition-none",
            isOpen && "rotate-180 text-primary"
          )}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MonthlyExtraStrategyBody({
  amount,
  view,
  hasRun,
  showSchedule,
  onAmountChange,
  onRun,
  onToggleSchedule
}: {
  amount: string;
  view: MonthlyExtraSimulationView | null;
  hasRun: boolean;
  showSchedule: boolean;
  onAmountChange: (value: string) => void;
  onRun: () => void;
  onToggleSchedule: () => void;
}) {
  const amountValue = toNumber(amount);
  const canRun = amountValue > 0 && view?.valid === true;

  return (
    <>
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Monthly Extra Amount
        </span>
        <input
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          inputMode="numeric"
          placeholder="e.g. 5000"
          className={cn(
            "h-12 w-full border border-border bg-card/80 px-4 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-primary/35",
            radius.input
          )}
        />
      </label>

      {view && !view.valid && view.errors.length > 0 ? (
        <p className="text-xs leading-5 text-rose-600">{view.errors[0]}</p>
      ) : null}

      {view && view.valid ? (
        <div className={cn("space-y-2 bg-white/45", radius.inner, "p-4")}>
          <p className="text-xs font-medium text-muted-foreground">
            At this rate you will approximately:
          </p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Close your loan {formatMonths(view.monthsSaved)} earlier</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Save approximately {formatInrCompact(view.interestSaved)} in interest</span>
            </li>
          </ul>
        </div>
      ) : null}

      <Button type="button" className="w-full" onClick={onRun} disabled={!canRun}>
        Run Simulation
      </Button>

      {hasRun && view && view.valid ? (
        <MonthlyExtraResultPanel
          view={view}
          showSchedule={showSchedule}
          onToggleSchedule={onToggleSchedule}
        />
      ) : null}
    </>
  );
}

function MonthlyExtraResultPanel({
  view,
  showSchedule,
  onToggleSchedule
}: {
  view: MonthlyExtraSimulationView;
  showSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  return (
    <div className={cn("space-y-4 bg-primary text-primary-foreground", radius.card, card.paddingCompact)}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
          Monthly Extra Payment
        </p>
        <h3 className="font-display text-3xl leading-tight tracking-[-0.04em]">
          Close {formatMonths(view.monthsSaved)} earlier
        </h3>
        <p className="text-sm leading-6 opacity-75">
          Paying {formatInr(view.monthlyExtraAmount)} extra every month clears your loan sooner and
          reduces total interest.
        </p>
      </div>

      <MetricCardGrid>
        <MetricCard label="Int. saved" value={formatInr(view.interestSaved)} variant="dark" />
        <MetricCard label="Closes" value={`${formatMonths(view.monthsSaved)} earlier`} variant="dark" />
      </MetricCardGrid>

      <div className={cn("space-y-3 bg-white/10 text-sm", radius.inner, card.paddingCompact)}>
        <div className="flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.16em] opacity-60">
          <span>Metric</span>
          <span>Current → With extra</span>
        </div>
        <ComparisonRow
          label="Closure date"
          current={formatDisplayDate(view.originalClosureDate ?? "")}
          next={formatDisplayDate(view.newClosureDate ?? "")}
        />
        <ComparisonRow
          label="Total interest"
          current={formatInr(view.originalTotalInterest)}
          next={formatInr(view.simulatedTotalInterest)}
        />
        <ComparisonRow
          label="Total payments"
          current={formatInr(view.originalTotalPayments)}
          next={formatInr(view.totalPaid)}
        />
        <ComparisonRow
          label="Remaining months"
          current={`${view.originalMonths}`}
          next={`${view.newMonths}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryStat label="Months saved" value={`${view.monthsSaved}`} />
        <SummaryStat label="Total extra paid" value={formatInr(view.totalExtraPaid)} />
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={onToggleSchedule}>
        {showSchedule ? "Hide Schedule" : "Debug: Month-by-month"}
      </Button>

      {showSchedule ? <ScheduleDebugTable rows={view.scheduleRows} /> : null}
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  next
}: {
  label: string;
  current: string;
  next: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs opacity-65">{label}</span>
      <span className="text-right text-sm">
        <span className="opacity-55">{current}</span>
        <span className="px-1 opacity-40">→</span>
        <span className="font-medium">{next}</span>
      </span>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("bg-white/10", radius.inner, "px-4 py-3")}>
      <p className="text-[0.68rem] uppercase tracking-[0.16em] opacity-60">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function ScheduleDebugTable({ rows }: { rows: AmortizationScheduleRow[] }) {
  return (
    <div className={cn("bg-white/10", radius.inner, "p-3")}>
      <div className="max-h-72 overflow-auto">
        <table className="w-full border-collapse text-[0.68rem]">
          <thead className="sticky top-0 bg-primary text-left">
            <tr className="opacity-80">
              <th className="px-1 py-1">#</th>
              <th className="px-1 py-1 text-right">Opening</th>
              <th className="px-1 py-1 text-right">Interest</th>
              <th className="px-1 py-1 text-right">Principal</th>
              <th className="px-1 py-1 text-right">Extra</th>
              <th className="px-1 py-1 text-right">Closing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.monthNumber} className="border-t border-white/10">
                <td className="px-1 py-1">{row.monthNumber}</td>
                <td className="px-1 py-1 text-right">{formatInr(row.openingBalance)}</td>
                <td className="px-1 py-1 text-right">{formatInr(row.interest)}</td>
                <td className="px-1 py-1 text-right">{formatInr(row.principal)}</td>
                <td className="px-1 py-1 text-right">{formatInr(row.extraPayment)}</td>
                <td className="px-1 py-1 text-right">{formatInr(row.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatInrCompact(value: number) {
  const abs = Math.abs(value);

  if (abs >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(1)} crore`;
  }

  if (abs >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(1)} lakh`;
  }

  if (abs >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}k`;
  }

  return formatInr(value);
}

function StrategyGoalButton({
  label,
  description,
  isSelected,
  onClick
}: {
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={getStrategyCardClassName(isSelected)}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-medium">{label}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
        </span>
        {isSelected ? (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Selected</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}

function RecommendationCard({
  loan,
  result,
  selectedStrategy,
  engineResult,
  compareResult,
  showComparison,
  showFullCalculation,
  onShowComparison,
  onShowFullCalculation
}: {
  loan: Loan;
  result: ReturnType<typeof simulateLoanPrepayment>;
  selectedStrategy: SimulatorStrategy | null;
  engineResult: HomeLoanSimulationResult | null;
  compareResult: HomeLoanCompareResult | null;
  showComparison: boolean;
  showFullCalculation: boolean;
  onShowComparison: () => void;
  onShowFullCalculation: () => void;
}) {
  const recommendedStrategy = getRecommendedStrategy(result, compareResult, selectedStrategy);

  return (
    <div className={cn("space-y-4 bg-primary text-primary-foreground", radius.card, card.paddingCompact)}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
          Recommended Strategy
        </p>
        <h3 className="font-display text-3xl leading-tight tracking-[-0.04em]">
          {recommendedStrategy.title}
        </h3>
        <p className="text-sm leading-6 opacity-75">{recommendedStrategy.reason}</p>
      </div>

      <MetricCardGrid>
        <MetricCard
          label="Int. saved"
          value={formatInr(result.estimatedInterestSaved)}
          variant="dark"
        />
        <MetricCard label="Closes" value={getLoanClosesLabel(result)} variant="dark" />
      </MetricCardGrid>

      <div className="grid grid-cols-1 gap-3">
        {compareResult ? (
          <Button type="button" variant="secondary" className="w-full" onClick={onShowComparison}>
            {showComparison ? "Hide Comparison" : "Compare Both"}
          </Button>
        ) : null}
        {engineResult ? (
          <Button type="button" variant="secondary" className="w-full" onClick={onShowFullCalculation}>
            {showFullCalculation ? "Hide Calculation" : "See Full Calculation"}
          </Button>
        ) : null}
      </div>

      {showComparison && compareResult ? (
        <ComparisonPanel compareResult={compareResult} />
      ) : null}

      {showFullCalculation && engineResult ? (
        <FullCalculationPanel loan={loan} engineResult={engineResult} />
      ) : null}
    </div>
  );
}

function ComparisonPanel({ compareResult }: { compareResult: HomeLoanCompareResult }) {
  const preferred = compareResult.recommendation.preferredStrategy;

  return (
    <div className={cn("space-y-3 bg-white/10 text-sm", radius.inner, card.paddingCompact)}>
      <p className="font-semibold">Why this recommendation</p>
      <p className="text-xs leading-5 opacity-75">{compareResult.recommendation.reason}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ComparisonOption
          title="Reduce Tenure"
          isRecommended={preferred === "reduce-tenure"}
          items={[
            "EMI stays same",
            "Loan closes earlier",
            `Interest saved ${formatInr(compareResult.reduceTenure.outcome.interestSaved)}`,
            `New closure ${formatDisplayDate(compareResult.reduceTenure.outcome.estimatedClosureDate)}`
          ]}
        />
        <ComparisonOption
          title="Reduce EMI"
          isRecommended={preferred === "reduce-emi"}
          items={[
            `New EMI ${formatInr(compareResult.reduceEmi.outcome.revisedEmi ?? 0)}`,
            "Loan duration stays same",
            `Interest saved ${formatInr(compareResult.reduceEmi.outcome.interestSaved)}`,
            `Monthly EMI ${formatInr(compareResult.reduceEmi.outcome.revisedEmi ?? 0)}`
          ]}
        />
      </div>
    </div>
  );
}

function ComparisonOption({
  title,
  items,
  isRecommended
}: {
  title: string;
  items: string[];
  isRecommended: boolean;
}) {
  return (
    <div className={cn("bg-white/10", radius.inner, card.paddingCompact)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{title}</p>
        {isRecommended ? (
          <span className="rounded-full bg-white px-3 py-1 text-[0.68rem] font-medium text-primary">
            Recommended
          </span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2 text-xs leading-5 opacity-75">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function FullCalculationPanel({
  loan,
  engineResult
}: {
  loan: Loan;
  engineResult: HomeLoanSimulationResult;
}) {
  const rows = [
    ["Outstanding Principal", formatInr(loan.outstandingBalance)],
    ["Current EMI", formatInr(loan.monthlyEmi)],
    ["Remaining Tenure", `${loan.remainingTenureMonths} months`],
    ["Prepayment Applied", formatInr(loan.outstandingBalance - engineResult.outcome.revisedOutstanding)],
    ["New Outstanding", formatInr(engineResult.outcome.revisedOutstanding)],
    [
      "New EMI",
      engineResult.outcome.revisedEmi
        ? formatInr(engineResult.outcome.revisedEmi)
        : formatInr(loan.monthlyEmi)
    ],
    ["New Tenure", `${engineResult.outcome.remainingMonths} months`],
    ["Original Interest", formatInr(engineResult.baseline.totalInterestRemaining)],
    [
      "Revised Interest",
      formatInr(
        engineResult.baseline.totalInterestRemaining - engineResult.outcome.interestSaved
      )
    ],
    ["Interest Saved", formatInr(engineResult.outcome.interestSaved)],
    ["New Closure Date", formatDisplayDate(engineResult.outcome.estimatedClosureDate)]
  ];

  return (
    <div className={cn("space-y-3 bg-white/10 text-sm", radius.inner, card.paddingCompact)}>
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4" aria-hidden="true" />
        <p className="font-semibold">Full calculation</p>
      </div>
      <div className="divide-y divide-white/10">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3">
            <p className="text-xs opacity-65">{label}</p>
            <p className="text-right text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStrategyCardClassName(isSelected: boolean) {
  return cn(
    radius.inner,
    "border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-primary/35 motion-reduce:transition-none",
    isSelected
      ? "border-primary/45 bg-card shadow-card"
      : "border-border bg-card/70 hover:bg-card"
  );
}

function getRecommendedStrategy(
  result: ReturnType<typeof simulateLoanPrepayment>,
  compareResult: HomeLoanCompareResult | null,
  selectedStrategy: SimulatorStrategy | null
) {
  if (
    selectedStrategy === "compare" &&
    compareResult?.recommendation.preferredStrategy
  ) {
    if (compareResult.recommendation.preferredStrategy === "reduce-tenure") {
      return {
        title: "Reduce Tenure",
        reason: compareResult.recommendation.reason
      };
    }

    return {
      title: "Reduce EMI",
      reason: compareResult.recommendation.reason
    };
  }

  if (result.strategy === "reduce-emi") {
    return {
      title: "Reduce EMI",
      reason:
        "This option gives more breathing room each month while keeping the loan length similar."
    };
  }

  return {
    title: "Reduce Tenure",
    reason:
      "This option provides higher total savings while keeping your EMI unchanged."
  };
}

function getLoanClosesLabel(result: ReturnType<typeof simulateLoanPrepayment>) {
  if (result.strategy === "reduce-emi") {
    return "same tenure";
  }

  if (result.estimatedMonthsSaved <= 0) {
    return "no major change";
  }

  return `${formatMonths(result.estimatedMonthsSaved)} earlier`;
}

function formatMonths(months: number) {
  if (months < 12) {
    return `${months} months`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} years`;
  }

  return `${years} years ${remainingMonths} months`;
}

function formatDisplayDate(value: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
