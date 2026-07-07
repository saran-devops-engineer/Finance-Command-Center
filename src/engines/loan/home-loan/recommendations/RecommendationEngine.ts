import type {
  HomeLoanRecommendation,
  RecommendationRequest
} from "@/engines/loan/home-loan/types/LoanInterfaces";

/**
 * Produces explainable Home Loan repayment recommendations.
 * Single responsibility: decision guidance — no calculations.
 */
export interface RecommendationEngine {
  recommend(request: RecommendationRequest): HomeLoanRecommendation;
}

export class HomeLoanRecommendationEngine implements RecommendationEngine {
  /**
   * @todo Apply handbook recommendation rules when banking logic is supplied.
   * @todo Remain explainable — every recommendation must include a reason string.
   */
  recommend(_request: RecommendationRequest): HomeLoanRecommendation {
    throw new Error(
      "HomeLoanRecommendationEngine.recommend is not implemented. Awaiting banking rules."
    );
  }
}

export const recommendationEngine: RecommendationEngine = new HomeLoanRecommendationEngine();
