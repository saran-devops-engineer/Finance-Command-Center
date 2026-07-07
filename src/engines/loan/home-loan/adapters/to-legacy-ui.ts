import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";
import type { LumpSumSimulationResult } from "@/engines/loan/home-loan/core/types";
import type { StrategyComparisonResult } from "@/engines/loan/home-loan/core/types";
import type {
  AmortizationSchedule as LegacySchedule,
  HomeLoanCompareResult,
  HomeLoanSimulationInput,
  HomeLoanSimulationResult
} from "@/services/home-loan-simulation/types";

export function snapshotFromLegacyInput(input: HomeLoanSimulationInput): HomeLoanSimulationSnapshot {
  return {
    loanId: input.loanId,
    outstandingPrincipal: input.outstandingBalance,
    monthlyEmi: input.monthlyEmi,
    annualInterestRate: input.annualInterestRate,
    remainingTenureMonths: input.remainingTenureMonths,
    loanStartDate: input.loanStartDate ?? input.asOfDate ?? new Date().toISOString().slice(0, 10),
    emiPaymentDay: input.emiPaymentDay ?? 1,
    asOfDate: input.asOfDate ?? new Date().toISOString().slice(0, 10),
    status: "active"
  };
}

export function toLegacySimulationResult(
  input: HomeLoanSimulationInput,
  scenarioKind: HomeLoanSimulationResult["scenario"],
  result: LumpSumSimulationResult
): HomeLoanSimulationResult {
  return {
    scenario: scenarioKind,
    isEstimate: true,
    input,
    baseline: {
      remainingMonths: result.comparison.original.tenureMonths,
      totalInterestRemaining: result.comparison.original.totalInterest,
      estimatedClosureDate: result.comparison.original.closureDate ?? ""
    },
    outcome: {
      remainingMonths: result.comparison.simulated.tenureMonths,
      revisedEmi: result.strategy === "reduce-emi" ? result.newEmi : undefined,
      monthsSaved: result.monthsSaved,
      interestSaved: result.interestSaved,
      revisedOutstanding: result.newOutstanding,
      estimatedClosureDate: result.closureDate ?? ""
    },
    schedule: toLegacySchedule(result.comparison.simulated),
    assumptions: [
      "All values are derived from complete amortization schedules.",
      "Current snapshot fields are the simulation starting point.",
      "Original loan amount is not used in calculations."
    ],
    warnings: result.warnings
  };
}

export function toLegacyCompareResult(
  input: HomeLoanSimulationInput,
  comparison: StrategyComparisonResult
): HomeLoanCompareResult {
  return {
    prepaymentAmount: comparison.prepaymentAmount,
    reduceTenure: toLegacySimulationResult(input, "prepay-reduce-tenure", comparison.reduceTenure),
    reduceEmi: toLegacySimulationResult(input, "prepay-reduce-emi", comparison.reduceEmi),
    recommendation: {
      preferredStrategy: comparison.recommendation.preferredStrategy,
      reason: comparison.recommendation.reason
    }
  };
}

function toLegacySchedule(schedule: LumpSumSimulationResult["comparison"]["simulated"]): LegacySchedule {
  return {
    months: schedule.rows.map((row) => ({
      monthIndex: row.monthNumber,
      calendarMonth: row.paymentDate.slice(0, 7),
      openingBalance: row.openingBalance,
      interestComponent: row.interest,
      principalComponent: row.principal,
      emiPaid: row.emi,
      prepaymentApplied: row.extraPayment,
      closingBalance: row.closingBalance
    })),
    totalInterestPaid: schedule.totalInterest,
    totalPrincipalPaid: schedule.totalPrincipal,
    closureMonth: schedule.closureDate?.slice(0, 7) ?? null,
    tenureMonths: schedule.tenureMonths
  };
}
