import {
  DEFAULT_MINIMUM_EMERGENCY_BUFFER_INR,
  MEANINGFUL_INTEREST_SAVINGS_INR
} from "@/engines/loan/home-loan/constants";
import type {
  MonthlyExtraRecommendationContext,
  MonthlyExtraSimulationExplanation
} from "@/engines/loan/home-loan/types/MonthlyExtraRuleSet02";

export interface MonthlyExtraRecommendationInput {
  interestSaved: number;
  monthsSaved: number;
  monthlyExtraAmount: number;
  context?: MonthlyExtraRecommendationContext;
}

export function buildMonthlyExtraRecommendation(
  input: MonthlyExtraRecommendationInput
): MonthlyExtraSimulationExplanation {
  const reasons: string[] = [];
  const minimumBuffer =
    input.context?.minimumEmergencyBuffer ?? DEFAULT_MINIMUM_EMERGENCY_BUFFER_INR;
  const emergencyBuffer = input.context?.emergencyBuffer;
  const monthlyCashFlow = input.context?.monthlyCashFlow;
  const monthlyAvailableMoney = input.context?.monthlyAvailableMoney;
  const meaningfulSavings = input.interestSaved >= MEANINGFUL_INTEREST_SAVINGS_INR;

  if (emergencyBuffer !== undefined && emergencyBuffer <= minimumBuffer) {
    reasons.push("Emergency reserve would be compromised.");
  }

  if (monthlyCashFlow !== undefined && monthlyCashFlow <= 0) {
    reasons.push("Monthly cash flow is not positive after this extra payment.");
  }

  if (
    monthlyAvailableMoney !== undefined &&
    input.monthlyExtraAmount > monthlyAvailableMoney * 0.5
  ) {
    reasons.push("Extra payment consumes a large share of monthly available money.");
  }

  if (input.context?.hasHigherInterestDebt) {
    reasons.push("Higher-interest debt should be cleared before accelerating this loan.");
  }

  if (input.context?.canMaintainConsistently === false) {
    reasons.push("User cannot maintain the payment consistently.");
  }

  if (!meaningfulSavings) {
    reasons.push("Interest savings are below the meaningful threshold.");
  }

  const suitable = reasons.length === 0;

  if (suitable) {
    return {
      summary: "A consistent monthly extra payment improves your loan position with meaningful savings.",
      recommendation: "Proceed with monthly extra payment",
      confidence: input.monthsSaved > 0 ? "high" : "medium",
      suitable: true,
      reasons: [
        "Emergency fund remains healthy.",
        "Monthly cash flow stays positive.",
        `Estimated interest saved: ₹${input.interestSaved.toLocaleString("en-IN")}.`
      ]
    };
  }

  return {
    summary: "Monthly extra payment may not be suitable right now.",
    recommendation: "Defer monthly extra payment",
    confidence: "medium",
    suitable: false,
    reasons
  };
}
