import { getDaysUntil } from "@/engines/commitment";
import type { FinancialInsightRule } from "@/engines/financial-insights/types";
import { MEANINGFUL_INTEREST_SAVINGS_INR } from "@/engines/loan/home-loan/constants";
import { simulateMonthlyExtra } from "@/services/home-loan-simulation/presenters/monthly-extra";
import { formatInr } from "@/lib/utils";

const DEFAULT_MONTHLY_EXTRA_INR = 5_000;

export const homeLoanOpportunityRule: FinancialInsightRule = {
  id: "home-loan-opportunity",

  evaluate({ loans, referenceDate }) {
    const homeLoans = loans.filter((loan) => loan.type === "home");

    for (const loan of homeLoans) {
      const simulation = simulateMonthlyExtra(loan, DEFAULT_MONTHLY_EXTRA_INR);

      if (!simulation?.valid || simulation.monthsSaved <= 0) {
        continue;
      }

      if (simulation.interestSaved < MEANINGFUL_INTEREST_SAVINGS_INR) {
        continue;
      }

      return {
        id: `insight-home-loan-${loan.id}`,
        category: "opportunity",
        message: `An extra ${formatInr(DEFAULT_MONTHLY_EXTRA_INR)} per month could reduce your loan tenure and save interest.`,
        actionLabel: "Run Simulator",
        href: `/loans/${loan.id}?strategy=monthly-extra`,
        priority: 30
      };
    }

    return null;
  }
};

export const largestCommitmentRule: FinancialInsightRule = {
  id: "largest-commitment",

  evaluate({ commitments, referenceDate }) {
    const upcoming = commitments
      .filter((commitment) => getDaysUntil(commitment.dueDate, referenceDate) >= 0)
      .sort((first, second) => second.amount - first.amount)[0];

    if (!upcoming || upcoming.amount <= 0) {
      return null;
    }

    const daysUntil = getDaysUntil(upcoming.dueDate, referenceDate);

    if (daysUntil > 45) {
      return null;
    }

    return {
      id: `insight-largest-${upcoming.id}`,
      category: "warning",
      message:
        daysUntil <= 31
          ? `Your largest financial commitment (${formatInr(upcoming.amount)}) is due next month.`
          : `Your largest financial commitment is ${upcoming.title} for ${formatInr(upcoming.amount)}.`,
      actionLabel: upcoming.loanId ? "Open Commitment" : undefined,
      href: upcoming.loanId ? `/loans/${upcoming.loanId}` : undefined,
      priority: 25
    };
  }
};
