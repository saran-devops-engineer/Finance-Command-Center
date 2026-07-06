import {
  HIGH_DEBT_TO_INCOME_RATIO_THRESHOLD,
  PREPAYMENT_STRATEGY_RATE_THRESHOLD
} from "@/services/home-loan-simulation/constants";
import type {
  HomeLoanSimulationInput,
  HomeLoanSimulationResult,
  PrepaymentRecommendationContext,
  PrepaymentStrategyRecommendation
} from "@/services/home-loan-simulation/types";

export function recommendPrepaymentStrategy(params: {
  input: HomeLoanSimulationInput;
  reduceTenure: HomeLoanSimulationResult;
  reduceEmi: HomeLoanSimulationResult;
  context?: PrepaymentRecommendationContext;
}): PrepaymentStrategyRecommendation {
  const { input, context } = params;

  if (context?.hasStrongCashBuffer) {
    return {
      preferredStrategy: "reduce-tenure",
      reason:
        "You have a healthy cash buffer, so reducing tenure can save more interest over time."
    };
  }

  if (
    context?.debtToIncomeRatio !== undefined &&
    context.debtToIncomeRatio > HIGH_DEBT_TO_INCOME_RATIO_THRESHOLD
  ) {
    return {
      preferredStrategy: "reduce-emi",
      reason:
        "Your commitments are relatively high, so a lower EMI may be safer month to month."
    };
  }

  if (input.annualInterestRate > PREPAYMENT_STRATEGY_RATE_THRESHOLD) {
    return {
      preferredStrategy: "reduce-tenure",
      reason:
        "This home loan rate is relatively high, so closing the loan sooner saves more interest."
    };
  }

  return {
    preferredStrategy: "neutral",
    reason:
      "Both strategies are reasonable. Choose lower tenure to save interest or lower EMI for monthly relief."
  };
}
