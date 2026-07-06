import type {
  HomeLoanSimulationInput,
  HomeLoanSimulationScenario,
  ValidationResult
} from "@/services/home-loan-simulation/types";

export function validateScenario(
  scenario: HomeLoanSimulationScenario,
  input: HomeLoanSimulationInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (scenario.kind) {
    case "baseline-projection":
      break;
    case "compare-prepayment":
    case "prepay-reduce-tenure":
    case "prepay-reduce-emi": {
      const amount = scenario.prepaymentAmount;

      if (amount < 0) {
        errors.push("Prepayment amount cannot be negative.");
      }

      if (amount > input.outstandingBalance) {
        warnings.push("Prepayment amount exceeds outstanding balance and will be capped.");
      }

      if (amount === 0) {
        warnings.push("A zero prepayment returns the baseline projection.");
      }

      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function assertValidScenario(
  scenario: HomeLoanSimulationScenario,
  input: HomeLoanSimulationInput
): string[] {
  const result = validateScenario(scenario, input);

  if (!result.valid) {
    throw new Error(result.errors[0]);
  }

  return result.warnings;
}

export function clampPrepaymentAmount(
  input: HomeLoanSimulationInput,
  prepaymentAmount: number
) {
  return Math.min(Math.max(prepaymentAmount, 0), input.outstandingBalance);
}
