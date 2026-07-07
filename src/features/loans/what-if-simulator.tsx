"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { cn, formatInr } from "@/lib/utils";
import { card, radius } from "@/lib/design-tokens";
import {
  homeLoanSimulationEngine,
  simulateLoanPrepayment,
  tryFromLoan
} from "@/services/home-loan-simulation";
import type { LoanPrepaymentStrategy } from "@/services/home-loan-simulation/presenters/loan-prepayment";
import type {
  HomeLoanCompareResult,
  HomeLoanSimulationResult
} from "@/services/home-loan-simulation";
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
    description: "Explore a recurring monthly add-on.",
    isAvailable: false
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
  const [selectedStrategy, setSelectedStrategy] = useState<SimulatorStrategy | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState("100000");
  const [goal, setGoal] = useState<LoanPrepaymentStrategy>("reduce-tenure");
  const [hasRunSimulation, setHasRunSimulation] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showFullCalculation, setShowFullCalculation] = useState(false);

  const amount = toNumber(prepaymentAmount);
  const homeLoanInput = useMemo(() => tryFromLoan(loan), [loan]);
  const selectedResult = useMemo(() => {
    if (!hasRunSimulation || !selectedStrategy || !amount) {
      return null;
    }

    const activeGoal = selectedStrategy === "compare" ? "reduce-tenure" : goal;
    return simulateLoanPrepayment(loan, amount, activeGoal);
  }, [amount, goal, hasRunSimulation, loan, selectedStrategy]);

  const engineResult = selectedResult?.engineResult ?? null;

  const compareResult = useMemo(() => {
    if (!hasRunSimulation || selectedStrategy !== "compare" || !homeLoanInput || !amount) {
      return null;
    }

    return homeLoanSimulationEngine.comparePrepayment(homeLoanInput, amount);
  }, [amount, hasRunSimulation, homeLoanInput, selectedStrategy]);

  function handleExpandedChange(nextValue: boolean) {
    setIsExpanded(nextValue);

    if (!nextValue) {
      setHasRunSimulation(false);
      setShowComparison(false);
      setShowFullCalculation(false);
    }
  }

  function handleSelectStrategy(strategy: SimulatorStrategy) {
    setSelectedStrategy(strategy);
    setHasRunSimulation(false);
    setShowComparison(false);
    setShowFullCalculation(false);
  }

  function handleRunSimulation() {
    setHasRunSimulation(true);
    setShowComparison(selectedStrategy === "compare");
    setShowFullCalculation(false);
  }

  const canRunSelectedStrategy =
    selectedStrategy === "one-time" || selectedStrategy === "compare";

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

          <div className="grid gap-3 sm:grid-cols-2">
            {simulatorStrategies.map((strategy) => (
              <button
                key={strategy.id}
                type="button"
                onClick={() => handleSelectStrategy(strategy.id)}
                className={getStrategyCardClassName(selectedStrategy === strategy.id)}
                aria-pressed={selectedStrategy === strategy.id}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{strategy.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {strategy.description}
                    </span>
                  </span>
                  {selectedStrategy === strategy.id ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  ) : null}
                </span>
                {!strategy.isAvailable ? (
                  <span className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-[0.68rem] font-medium text-muted-foreground">
                    Planned
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {selectedStrategy ? (
          <div className={cn("space-y-4 bg-white/45", radius.card, card.paddingCompact)}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Step 2
              </p>
              <h3 className="font-display text-2xl tracking-[-0.04em]">
                {getSelectedStrategyTitle(selectedStrategy)}
              </h3>
            </div>

            {canRunSelectedStrategy ? (
              <>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Amount
                  </span>
                  <input
                    value={prepaymentAmount}
                    onChange={(event) => {
                      setPrepaymentAmount(event.target.value);
                      setHasRunSimulation(false);
                      setShowComparison(false);
                      setShowFullCalculation(false);
                    }}
                    inputMode="numeric"
                    className={cn("h-12 w-full border border-border bg-card/80 px-4 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-primary/35", radius.input)}
                  />
                </label>

                {selectedStrategy === "one-time" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Goal
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <StrategyGoalButton
                        label="Reduce Tenure"
                        description="Same EMI, close sooner"
                        isSelected={goal === "reduce-tenure"}
                        onClick={() => {
                          setGoal("reduce-tenure");
                          setHasRunSimulation(false);
                        }}
                      />
                      <StrategyGoalButton
                        label="Reduce EMI"
                        description="Lower monthly EMI"
                        isSelected={goal === "reduce-emi"}
                        onClick={() => {
                          setGoal("reduce-emi");
                          setHasRunSimulation(false);
                        }}
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
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                This strategy needs additional loan details and will be added later. Use
                one-time extra payment or compare strategies for now.
              </p>
            )}
          </div>
        ) : null}

        {selectedResult ? (
          <RecommendationCard
            loan={loan}
            result={selectedResult}
            selectedStrategy={selectedStrategy}
            engineResult={engineResult}
            compareResult={compareResult}
            showComparison={showComparison}
            showFullCalculation={showFullCalculation}
            onShowComparison={() => setShowComparison((current) => !current)}
            onShowFullCalculation={() => setShowFullCalculation((current) => !current)}
          />
        ) : null}
      </ExpandableCard>
    </section>
  );
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

function getSelectedStrategyTitle(strategy: SimulatorStrategy) {
  return simulatorStrategies.find((item) => item.id === strategy)?.title ?? "Strategy";
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
