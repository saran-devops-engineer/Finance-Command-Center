import type { AmortizationSchedule } from "@/services/home-loan-simulation/types";
import { buildBaselineSchedule } from "@/services/home-loan-simulation/scenarios/result-builder";
import { clampPrepaymentAmount } from "@/services/home-loan-simulation/validation/validate-scenario";
import type { HomeLoanSimulationInput } from "@/services/home-loan-simulation/types";

export function preparePrepaymentSimulation(
  input: HomeLoanSimulationInput,
  prepaymentAmount: number,
  maxMonths?: number,
  baselineSchedule?: AmortizationSchedule
) {
  const safePrepayment = clampPrepaymentAmount(input, prepaymentAmount);

  return {
    safePrepayment,
    revisedOutstanding: input.outstandingBalance - safePrepayment,
    baselineSchedule: baselineSchedule ?? buildBaselineSchedule(input, maxMonths)
  };
}
