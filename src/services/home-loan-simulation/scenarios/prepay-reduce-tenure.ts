import { buildAmortizationSchedule } from "@/services/home-loan-simulation/calculators/amortization-schedule";
import { preparePrepaymentSimulation } from "@/services/home-loan-simulation/scenarios/prepayment-setup";
import {
  buildSimulationResult,
  resolveAsOfDate
} from "@/services/home-loan-simulation/scenarios/result-builder";
import { createWarningCollector } from "@/services/home-loan-simulation/scenarios/warning-collector";
import type {
  AmortizationSchedule,
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions
} from "@/services/home-loan-simulation/types";

export function runPrepayReduceTenure(
  input: HomeLoanSimulationInput,
  prepaymentAmount: number,
  options?: HomeLoanSimulationOptions,
  warnings?: string[],
  sharedBaselineSchedule?: AmortizationSchedule
) {
  const activeWarnings = createWarningCollector(warnings);
  const maxMonths = options?.maxScheduleMonths;
  const { revisedOutstanding, baselineSchedule } = preparePrepaymentSimulation(
    input,
    prepaymentAmount,
    maxMonths,
    sharedBaselineSchedule
  );
  const outcomeSchedule = buildAmortizationSchedule({
    principal: revisedOutstanding,
    annualInterestRate: input.annualInterestRate,
    monthlyEmi: input.monthlyEmi,
    asOfDate: resolveAsOfDate(input),
    maxMonths
  });

  if (!outcomeSchedule.closureMonth) {
    activeWarnings.push("Prepayment projection did not reach closure within the schedule cap.");
  }

  return buildSimulationResult({
    input,
    scenario: "prepay-reduce-tenure",
    baselineSchedule,
    outcomeSchedule,
    revisedOutstanding,
    warnings: activeWarnings,
    includeSchedule: options?.includeSchedule
  });
}
