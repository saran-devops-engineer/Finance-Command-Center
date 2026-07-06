import { STANDARD_ASSUMPTIONS } from "@/services/home-loan-simulation/constants";
import {
  buildAmortizationSchedule,
  summarizeSchedule
} from "@/services/home-loan-simulation/calculators/amortization-schedule";
import { estimateClosureDate } from "@/services/home-loan-simulation/calculators/emi";
import type {
  AmortizationSchedule,
  HomeLoanSimulationInput,
  HomeLoanSimulationResult,
  HomeLoanSimulationScenario
} from "@/services/home-loan-simulation/types";

export function buildSimulationResult(params: {
  input: HomeLoanSimulationInput;
  scenario: HomeLoanSimulationScenario["kind"];
  baselineSchedule: AmortizationSchedule;
  outcomeSchedule: AmortizationSchedule;
  revisedOutstanding: number;
  revisedEmi?: number;
  warnings: string[];
  includeSchedule?: boolean;
}): HomeLoanSimulationResult {
  const asOfDate = params.input.asOfDate ?? new Date().toISOString();
  const baseline = summarizeSchedule(params.baselineSchedule);
  const outcome = summarizeSchedule(params.outcomeSchedule);

  const baselineClosureDate =
    baseline.estimatedClosureDate || estimateClosureDate(asOfDate, baseline.remainingMonths);
  const outcomeClosureDate =
    outcome.estimatedClosureDate || estimateClosureDate(asOfDate, outcome.remainingMonths);

  return {
    scenario: params.scenario,
    isEstimate: true,
    input: params.input,
    baseline: {
      remainingMonths: baseline.remainingMonths,
      totalInterestRemaining: baseline.totalInterestRemaining,
      estimatedClosureDate: baselineClosureDate
    },
    outcome: {
      remainingMonths: outcome.remainingMonths,
      revisedEmi: params.revisedEmi,
      monthsSaved: Math.max(baseline.remainingMonths - outcome.remainingMonths, 0),
      interestSaved: Math.max(
        baseline.totalInterestRemaining - outcome.totalInterestRemaining,
        0
      ),
      revisedOutstanding: params.revisedOutstanding,
      estimatedClosureDate: outcomeClosureDate
    },
    schedule: params.includeSchedule ? params.outcomeSchedule : undefined,
    assumptions: [...STANDARD_ASSUMPTIONS],
    warnings: params.warnings
  };
}

export function resolveAsOfDate(input: HomeLoanSimulationInput) {
  return input.asOfDate ?? new Date().toISOString();
}

export function buildBaselineSchedule(
  input: HomeLoanSimulationInput,
  maxMonths?: number
) {
  return buildAmortizationSchedule({
    principal: input.outstandingBalance,
    annualInterestRate: input.annualInterestRate,
    monthlyEmi: input.monthlyEmi,
    asOfDate: resolveAsOfDate(input),
    maxMonths
  });
}
