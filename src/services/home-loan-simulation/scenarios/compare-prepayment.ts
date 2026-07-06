import { recommendPrepaymentStrategy } from "@/services/home-loan-simulation/recommendations/prepayment-strategy";
import { buildBaselineSchedule } from "@/services/home-loan-simulation/scenarios/result-builder";
import { runPrepayReduceEmi } from "@/services/home-loan-simulation/scenarios/prepay-reduce-emi";
import { runPrepayReduceTenure } from "@/services/home-loan-simulation/scenarios/prepay-reduce-tenure";
import { clampPrepaymentAmount } from "@/services/home-loan-simulation/validation/validate-scenario";
import type {
  HomeLoanCompareResult,
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions,
  PrepaymentRecommendationContext
} from "@/services/home-loan-simulation/types";

export function runComparePrepayment(
  input: HomeLoanSimulationInput,
  prepaymentAmount: number,
  options?: HomeLoanSimulationOptions & {
    recommendationContext?: PrepaymentRecommendationContext;
  },
  warnings?: string[]
): HomeLoanCompareResult {
  const safePrepayment = clampPrepaymentAmount(input, prepaymentAmount);
  const sharedBaselineSchedule = buildBaselineSchedule(input, options?.maxScheduleMonths);
  const sharedWarnings = [...(warnings ?? [])];
  const reduceTenure = runPrepayReduceTenure(
    input,
    safePrepayment,
    options,
    sharedWarnings,
    sharedBaselineSchedule
  );
  const reduceEmi = runPrepayReduceEmi(input, safePrepayment, options, [...sharedWarnings]);

  return {
    prepaymentAmount: safePrepayment,
    reduceTenure,
    reduceEmi,
    recommendation: recommendPrepaymentStrategy({
      input,
      reduceTenure,
      reduceEmi,
      context: options?.recommendationContext
    })
  };
}
