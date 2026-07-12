export type {
  FinancialInsight,
  FinancialInsightCategory,
  FinancialInsightContext,
  FinancialInsightRule
} from "@/engines/financial-insights/types";

export {
  generateAllFinancialInsights,
  generateFinancialInsights,
  registerFinancialInsightRule
} from "@/engines/financial-insights/insight-engine";

export {
  commitmentWarningRule,
  positiveStatusRule,
  savingsRecommendationRule
} from "@/engines/financial-insights/rules/commitment-rules";

export {
  homeLoanOpportunityRule,
  largestCommitmentRule
} from "@/engines/financial-insights/rules/home-loan-rules";

export {
  chitActiveInsightRule,
  chitNearingCompletionInsightRule,
  chitPrizeReceivedInsightRule
} from "@/engines/financial-insights/rules/chit-rules";
