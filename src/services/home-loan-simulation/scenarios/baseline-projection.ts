import {
  buildBaselineSchedule,
  buildSimulationResult
} from "@/services/home-loan-simulation/scenarios/result-builder";
import { createWarningCollector } from "@/services/home-loan-simulation/scenarios/warning-collector";
import type {
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions
} from "@/services/home-loan-simulation/types";

export function runBaselineProjection(
  input: HomeLoanSimulationInput,
  options?: HomeLoanSimulationOptions,
  warnings?: string[]
) {
  const activeWarnings = createWarningCollector(warnings);
  const maxMonths = options?.maxScheduleMonths;
  const baselineSchedule = buildBaselineSchedule(input, maxMonths);

  if (!baselineSchedule.closureMonth) {
    activeWarnings.push("Baseline projection did not reach closure within the schedule cap.");
  }

  return buildSimulationResult({
    input,
    scenario: "baseline-projection",
    baselineSchedule,
    outcomeSchedule: baselineSchedule,
    revisedOutstanding: input.outstandingBalance,
    warnings: activeWarnings,
    includeSchedule: options?.includeSchedule
  });
}
