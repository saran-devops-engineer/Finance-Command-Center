import { DEFAULT_MAX_SCHEDULE_EXPORT_MONTHS } from "@/services/home-loan-simulation/constants";
import { runBaselineProjection } from "@/services/home-loan-simulation/scenarios/baseline-projection";
import { runComparePrepayment } from "@/services/home-loan-simulation/scenarios/compare-prepayment";
import { runPrepayReduceEmi } from "@/services/home-loan-simulation/scenarios/prepay-reduce-emi";
import { runPrepayReduceTenure } from "@/services/home-loan-simulation/scenarios/prepay-reduce-tenure";
import { assertValidInput } from "@/services/home-loan-simulation/validation/validate-input";
import {
  assertValidScenario,
  clampPrepaymentAmount
} from "@/services/home-loan-simulation/validation/validate-scenario";
import type {
  HomeLoanSimulationEngine,
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions,
  HomeLoanSimulationScenario
} from "@/services/home-loan-simulation/types";

function resolveOptions(options?: HomeLoanSimulationOptions) {
  return {
    includeSchedule: options?.includeSchedule ?? false,
    maxScheduleMonths: options?.maxScheduleMonths ?? DEFAULT_MAX_SCHEDULE_EXPORT_MONTHS
  };
}

function collectWarnings(
  input: HomeLoanSimulationInput,
  scenario: HomeLoanSimulationScenario
) {
  return [...assertValidInput(input), ...assertValidScenario(scenario, input)];
}

export const homeLoanSimulationEngine: HomeLoanSimulationEngine = {
  simulate(input, scenario, options) {
    const resolvedOptions = resolveOptions(options);
    const warnings = collectWarnings(input, scenario);

    switch (scenario.kind) {
      case "baseline-projection":
        return runBaselineProjection(input, resolvedOptions, warnings);
      case "prepay-reduce-tenure":
        return runPrepayReduceTenure(
          input,
          clampPrepaymentAmount(input, scenario.prepaymentAmount),
          resolvedOptions,
          warnings
        );
      case "prepay-reduce-emi":
        return runPrepayReduceEmi(
          input,
          clampPrepaymentAmount(input, scenario.prepaymentAmount),
          resolvedOptions,
          warnings
        );
      case "compare-prepayment":
        throw new Error("Use comparePrepayment() for side-by-side prepayment comparison.");
    }
  },

  comparePrepayment(input, prepaymentAmount, options) {
    const resolvedOptions = resolveOptions(options);
    const scenario: HomeLoanSimulationScenario = {
      kind: "compare-prepayment",
      prepaymentAmount
    };
    const warnings = collectWarnings(input, scenario);

    return runComparePrepayment(input, prepaymentAmount, {
      ...resolvedOptions,
      recommendationContext: options?.recommendationContext
    }, warnings);
  },

  projectBaseline(input, options) {
    const resolvedOptions = resolveOptions(options);
    const warnings = collectWarnings(input, { kind: "baseline-projection" });

    return runBaselineProjection(input, resolvedOptions, warnings);
  }
};
