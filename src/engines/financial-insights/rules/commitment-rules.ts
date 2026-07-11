import {
  calendarMonthsUntil,
  getDaysUntil,
  sumCommitmentAmount,
  sumCommitmentsForMonth
} from "@/engines/commitment";
import type { FinancialCommitment } from "@/engines/commitment/types";
import type { FinancialInsight, FinancialInsightRule } from "@/engines/financial-insights/types";
import { formatInr } from "@/lib/utils";

/** Commitments above this share of normal obligations trigger a warning. */
const COMMITMENT_SPIKE_RATIO = 1.25;

export const savingsRecommendationRule: FinancialInsightRule = {
  id: "savings-recommendation",

  evaluate({ commitments, referenceDate }) {
    const candidate = [...commitments]
      .filter((commitment) => getDaysUntil(commitment.dueDate, referenceDate) > 7)
      .sort((first, second) => second.amount - first.amount)[0];

    if (!candidate || candidate.amount <= 0) {
      return null;
    }

    const monthsRemaining = calendarMonthsUntil(candidate.dueDate, referenceDate);
    const requiredSaving = Math.ceil(candidate.amount / monthsRemaining);

    if (requiredSaving <= 0) {
      return null;
    }

    return {
      id: `insight-savings-${candidate.id}`,
      category: "savings",
      message: `Save ${formatInr(requiredSaving)} every month to comfortably meet this commitment.`,
      actionLabel: "Open Commitment",
      href: candidate.loanId ? `/loans/${candidate.loanId}` : undefined,
      priority: 20
    };
  }
};

export const commitmentWarningRule: FinancialInsightRule = {
  id: "commitment-warning",

  evaluate({ commitments, moneyBreakdown, referenceDate }) {
    const normalMonthly = Math.max(moneyBreakdown.emis + moneyBreakdown.loanPayments, 1);
    const thisMonthTotal = sumCommitmentsForMonth(commitments, referenceDate);
    const nextMonthTotal = sumCommitmentAmount(
      commitments.filter((commitment) => isNextMonth(commitment, referenceDate))
    );

    const isSpike =
      thisMonthTotal > normalMonthly * COMMITMENT_SPIKE_RATIO ||
      thisMonthTotal + nextMonthTotal > normalMonthly * COMMITMENT_SPIKE_RATIO * 1.5;

    if (!isSpike) {
      return null;
    }

    if (thisMonthTotal >= nextMonthTotal && thisMonthTotal > normalMonthly * COMMITMENT_SPIKE_RATIO) {
      return {
        id: "insight-warning-this-month",
        category: "warning",
        message: "This month's commitments are higher than usual. Prepare funds in advance.",
        priority: 10
      };
    }

    return {
      id: "insight-warning-upcoming",
      category: "warning",
      message: "Upcoming commitments are higher than usual. Prepare funds in advance.",
      priority: 12
    };
  }
};

export const positiveStatusRule: FinancialInsightRule = {
  id: "positive-status",

  evaluate({ commitments, referenceDate }) {
    const urgentHighPriority = commitments.some(
      (commitment) =>
        (commitment.priority === "critical" || commitment.priority === "high") &&
        commitment.status === "due-soon" &&
        getDaysUntil(commitment.dueDate, referenceDate) >= 0
    );

    if (urgentHighPriority) {
      return null;
    }

    return {
      id: "insight-positive-status",
      category: "status",
      message: "You're on track. No major financial commitments require immediate attention.",
      priority: 80
    };
  }
};

function isNextMonth(commitment: FinancialCommitment, referenceDate?: string) {
  const reference = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();
  const due = new Date(`${commitment.dueDate.slice(0, 10)}T00:00:00`);
  const nextMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);

  return due.getFullYear() === nextMonth.getFullYear() && due.getMonth() === nextMonth.getMonth();
}
