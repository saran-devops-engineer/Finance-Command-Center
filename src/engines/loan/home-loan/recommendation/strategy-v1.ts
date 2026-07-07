import type {
  PrepaymentStrategy,
  StrategyComparisonResult,
  StrategyRecommendation
} from "@/engines/loan/home-loan/core/types";
import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";
import { simulateLumpSumPayment } from "@/engines/loan/home-loan/simulation/lump-sum";

export interface StrategyRecommendationContext {
  emiAffordable?: boolean;
  prioritizeCashFlow?: boolean;
}

export function comparePrepaymentStrategies(
  snapshot: HomeLoanSimulationSnapshot,
  prepaymentAmount: number,
  context: StrategyRecommendationContext = {},
  debug = false
): StrategyComparisonResult {
  const reduceTenure = simulateLumpSumPayment({
    snapshot,
    paymentAmount: prepaymentAmount,
    strategy: "reduce-tenure",
    debug
  });

  const reduceEmi = simulateLumpSumPayment({
    snapshot,
    paymentAmount: prepaymentAmount,
    strategy: "reduce-emi",
    debug
  });

  const recommendation = recommendStrategy(reduceTenure.interestSaved, reduceEmi.interestSaved, context);

  return {
    prepaymentAmount,
    reduceTenure,
    reduceEmi,
    recommendation,
    comparison: {
      interestSavedDelta: reduceTenure.interestSaved - reduceEmi.interestSaved,
      preferredStrategy: recommendation.preferredStrategy
    }
  };
}

function recommendStrategy(
  reduceTenureInterestSaved: number,
  reduceEmiInterestSaved: number,
  context: StrategyRecommendationContext
): StrategyRecommendation {
  const emiAffordable = context.emiAffordable ?? true;
  const prioritizeCashFlow = context.prioritizeCashFlow ?? false;

  if (prioritizeCashFlow) {
    return {
      preferredStrategy: "reduce-emi",
      reason:
        "Reduce EMI lowers your monthly payment while keeping the loan duration unchanged, giving you more cash flow flexibility.",
      confidence: "high"
    };
  }

  if (reduceTenureInterestSaved > reduceEmiInterestSaved && emiAffordable) {
    return {
      preferredStrategy: "reduce-tenure",
      reason:
        "Reduce Tenure saves more total interest while keeping your current EMI unchanged, so you close the loan sooner with higher lifetime savings.",
      confidence: "high"
    };
  }

  if (!emiAffordable) {
    return {
      preferredStrategy: "reduce-emi",
      reason:
        "Reduce EMI is recommended because your current EMI may not remain affordable after this payment.",
      confidence: "medium"
    };
  }

  return {
    preferredStrategy: "reduce-tenure",
    reason:
      "Reduce Tenure provides equal or better interest savings while keeping your EMI constant.",
    confidence: "medium"
  };
}

export function recommendStrategyLabel(strategy: PrepaymentStrategy) {
  return strategy === "reduce-tenure" ? "Reduce Tenure" : "Reduce EMI";
}
