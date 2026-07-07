import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import {
  snapshotFromLegacyInput,
  toLegacyCompareResult,
  toLegacySimulationResult
} from "@/engines/loan/home-loan/adapters/to-legacy-ui";
import type {
  HomeLoanCompareResult,
  HomeLoanSimulationEngine,
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions,
  HomeLoanSimulationResult,
  HomeLoanSimulationScenario
} from "@/services/home-loan-simulation/types";

function assertValidScenario(
  input: HomeLoanSimulationInput,
  scenario: HomeLoanSimulationScenario
) {
  const snapshot = snapshotFromLegacyInput(input);

  if (scenario.kind === "baseline-projection") {
    homeLoanAmortizationEngine.projectBaseline(snapshot);
    return;
  }

  if (scenario.prepaymentAmount <= 0) {
    throw new Error("Prepayment amount must be greater than zero.");
  }

  if (scenario.prepaymentAmount > input.outstandingBalance) {
    throw new Error("Prepayment cannot exceed outstanding principal.");
  }
}

export const homeLoanSimulationEngine: HomeLoanSimulationEngine = {
  simulate(
    input: HomeLoanSimulationInput,
    scenario: HomeLoanSimulationScenario,
    options?: HomeLoanSimulationOptions
  ): HomeLoanSimulationResult {
    void options;
    assertValidScenario(input, scenario);
    const snapshot = snapshotFromLegacyInput(input);

    if (scenario.kind === "baseline-projection") {
      const baseline = homeLoanAmortizationEngine.projectBaseline(snapshot);

      return {
        scenario: "baseline-projection",
        isEstimate: true,
        input,
        baseline: {
          remainingMonths: baseline.tenureMonths,
          totalInterestRemaining: baseline.totalInterest,
          estimatedClosureDate: baseline.closureDate ?? ""
        },
        outcome: {
          remainingMonths: baseline.tenureMonths,
          monthsSaved: 0,
          interestSaved: 0,
          revisedOutstanding: input.outstandingBalance,
          estimatedClosureDate: baseline.closureDate ?? ""
        },
        assumptions: ["Baseline derived from full amortization schedule."],
        warnings: []
      };
    }

    const strategy =
      scenario.kind === "prepay-reduce-emi" ? "reduce-emi" : "reduce-tenure";

    const result = homeLoanAmortizationEngine.simulateLumpSum({
      snapshot,
      paymentAmount: scenario.prepaymentAmount,
      strategy
    });

    if (!result.valid) {
      throw new Error(result.errors.join(" "));
    }

    return toLegacySimulationResult(input, scenario.kind, result);
  },

  comparePrepayment(
    input: HomeLoanSimulationInput,
    prepaymentAmount: number,
    options?: HomeLoanSimulationOptions & {
      recommendationContext?: { hasStrongCashBuffer?: boolean };
    }
  ): HomeLoanCompareResult {
    const snapshot = snapshotFromLegacyInput(input);
    const comparison = homeLoanAmortizationEngine.comparePrepaymentStrategies(
      snapshot,
      prepaymentAmount,
      {
        emiAffordable: true,
        prioritizeCashFlow: options?.recommendationContext?.hasStrongCashBuffer === false
      }
    );

    return toLegacyCompareResult(input, comparison);
  },

  projectBaseline(
    input: HomeLoanSimulationInput,
    options?: HomeLoanSimulationOptions
  ): HomeLoanSimulationResult {
    void options;
    return homeLoanSimulationEngine.simulate(input, { kind: "baseline-projection" });
  }
};
