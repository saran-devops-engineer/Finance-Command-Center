import {
  chitActiveInsightRule,
  chitNearingCompletionInsightRule,
  chitPrizeReceivedInsightRule
} from "@/engines/financial-insights/rules/chit-rules";
import {
  commitmentWarningRule,
  positiveStatusRule,
  savingsRecommendationRule
} from "@/engines/financial-insights/rules/commitment-rules";
import {
  homeLoanOpportunityRule,
  largestCommitmentRule
} from "@/engines/financial-insights/rules/home-loan-rules";
import type {
  FinancialInsight,
  FinancialInsightContext,
  FinancialInsightRule
} from "@/engines/financial-insights/types";

const defaultRules: FinancialInsightRule[] = [
  commitmentWarningRule,
  chitNearingCompletionInsightRule,
  savingsRecommendationRule,
  largestCommitmentRule,
  homeLoanOpportunityRule,
  chitPrizeReceivedInsightRule,
  chitActiveInsightRule,
  positiveStatusRule
];

const registeredRules: FinancialInsightRule[] = [...defaultRules];

export function registerFinancialInsightRule(rule: FinancialInsightRule) {
  if (registeredRules.some((entry) => entry.id === rule.id)) {
    return;
  }

  registeredRules.push(rule);
}

export function generateFinancialInsights(
  context: FinancialInsightContext,
  limit = 3
): FinancialInsight[] {
  const insights = registeredRules
    .map((rule) => rule.evaluate(context))
    .filter((insight): insight is FinancialInsight => insight !== null)
    .sort((first, second) => first.priority - second.priority);

  const deduped: FinancialInsight[] = [];

  for (const insight of insights) {
    if (deduped.some((existing) => existing.category === insight.category && existing.message === insight.message)) {
      continue;
    }

    deduped.push(insight);

    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

export function generateAllFinancialInsights(context: FinancialInsightContext) {
  return generateFinancialInsights(context, Number.POSITIVE_INFINITY);
}
