import {
  DEFAULT_MINIMUM_EMERGENCY_BUFFER_INR,
  MEANINGFUL_INTEREST_SAVINGS_INR
} from "@/engines/loan/home-loan/constants";
import type {
  LumpSumRecommendationContext,
  LumpSumSimulationExplanation
} from "@/engines/loan/home-loan/types/LumpSumRuleSet01";

export interface LumpSumRecommendationInput {
  interestSaved: number;
  monthsSaved: number;
  isForeclosure: boolean;
  context?: LumpSumRecommendationContext;
}

export function buildLumpSumRecommendation(
  input: LumpSumRecommendationInput
): LumpSumSimulationExplanation {
  const reasons: string[] = [];
  const minimumBuffer =
    input.context?.minimumEmergencyBuffer ?? DEFAULT_MINIMUM_EMERGENCY_BUFFER_INR;
  const emergencyBuffer = input.context?.emergencyBuffer;
  const monthlyCashFlow = input.context?.monthlyCashFlow;
  const meaningfulSavings = input.interestSaved >= MEANINGFUL_INTEREST_SAVINGS_INR;

  if (input.isForeclosure) {
    return {
      summary: "This payment closes the loan in full.",
      recommendation: "Foreclosure",
      confidence: "high",
      suitable: true,
      reasons: [
        "Payment equals outstanding principal.",
        "No further EMI is required after closure."
      ]
    };
  }

  if (emergencyBuffer !== undefined && emergencyBuffer <= minimumBuffer) {
    reasons.push("Emergency buffer would fall below the configured minimum.");
  }

  if (monthlyCashFlow !== undefined && monthlyCashFlow <= 0) {
    reasons.push("Monthly cash flow is not positive after this payment.");
  }

  if (!meaningfulSavings) {
    reasons.push("Interest savings are below the meaningful threshold.");
  }

  const suitable = reasons.length === 0;

  if (suitable) {
    return {
      summary: "This lump sum improves your loan position with meaningful interest savings.",
      recommendation: "Proceed with part payment",
      confidence: input.monthsSaved > 0 ? "high" : "medium",
      suitable: true,
      reasons: [
        "Emergency buffer remains above the configured minimum.",
        "Monthly cash flow remains positive.",
        `Estimated interest saved: ₹${input.interestSaved.toLocaleString("en-IN")}.`
      ]
    };
  }

  return {
    summary: "This part payment may not be suitable right now.",
    recommendation: "Defer part payment",
    confidence: "medium",
    suitable: false,
    reasons
  };
}
