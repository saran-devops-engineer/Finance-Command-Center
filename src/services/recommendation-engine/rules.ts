import type { Loan, Recommendation, MoneyBreakdown, UpcomingDue } from "@/shared/domain/finance";
import { calculateAvailableMoney } from "@/services/financial-snapshot/available-money";

interface RecommendationInput {
  money: MoneyBreakdown;
  loans: Loan[];
  upcomingDues: UpcomingDue[];
}

export function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const availableMoney = calculateAvailableMoney(input.money);
  const highestInterestLoan = [...input.loans].sort(
    (first, second) => second.annualInterestRate - first.annualInterestRate
  )[0];

  const recommendations: Recommendation[] = [];

  if (availableMoney > 0) {
    recommendations.push({
      id: "available-money",
      title: `You have room to decide this month`,
      description: `Your available money is positive after mandatory commitments. Consider splitting it between savings and debt prepayment.`,
      tone: "positive",
      category: "cash-flow",
      actionLabel: "Review options"
    });
  } else {
    recommendations.push({
      id: "cash-flow-risk",
      title: "Mandatory commitments need attention",
      description: "Your planned commitments are higher than your current monthly income. Delay discretionary spending until dues are covered.",
      tone: "critical",
      category: "cash-flow",
      actionLabel: "See commitments"
    });
  }

  if (highestInterestLoan && availableMoney >= 10000) {
    recommendations.push({
      id: "highest-interest-loan",
      title: `${highestInterestLoan.name} has the highest interest rate`,
      description: `At ${highestInterestLoan.annualInterestRate}% p.a., this loan is the strongest candidate for a part-payment when your cash buffer is safe.`,
      tone: "warning",
      category: "debt",
      actionLabel: "Simulate prepayment"
    });
  }

  const overdueDue = input.upcomingDues.find((due) => due.isOverdue);
  if (overdueDue) {
    recommendations.push({
      id: "overdue-payment",
      title: `${overdueDue.title} is overdue`,
      description: "Clear overdue commitments first to avoid penalties and stress.",
      tone: "critical",
      category: "due-date",
      actionLabel: "View due"
    });
  }

  return recommendations.slice(0, 4);
}
